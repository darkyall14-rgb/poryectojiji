// Student/Teacher QR Generator Firebase Realtime Database Integration
// Script para crear sesiones QR y monitorear asistencia en tiempo real

const firebaseConfig = {
    apiKey: "AIzaSyC7-a1mwVT-OuiBaik7YYP5KyK4XUPKqvI",
    authDomain: "xanes-36606.firebaseapp.com",
    databaseURL: "https://xanes-36606-default-rtdb.firebaseio.com",
    projectId: "xanes-36606",
    storageBucket: "xanes-36606.firebasestorage.app",
    messagingSenderId: "853187362328",
    appId: "1:853187362328:web:ce602f8be9a2293e9ecd6d"
};

// Inicializar Firebase si no está inicializado
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const database = firebase.database();

let currentUser = null;

// ========== VARIABLES GLOBALES ==========

auth.onAuthStateChanged((user) => {
    currentUser = user;
    if (user) {
        console.log('✅ Usuario docente autenticado:', user.email);
        loadUserSessions();
    }
});

// ========== CREAR SESIÓN QR EN FIREBASE ==========

/**
 * Crear una nueva sesión QR en Firebase
 */
async function createQRSession(courseId, duration = 60) {
    if (!currentUser) {
        alert('Debes iniciar sesión como docente primero');
        return null;
    }

    try {
        const teacherId = currentUser.uid;
        const sessionData = {
            courseId: courseId,
            teacherId: teacherId,
            teacherEmail: currentUser.email,
            teacherName: currentUser.displayName || 'Docente',
            createdAt: new Date().toISOString(),
            duration: duration, // Duración en minutos
            isActive: true,
            attendees: {} // Se llenará conforme los estudiantes marquen asistencia
        };

        // Crear sesión con clave autogenerada
        const ref = database.ref(`sessions`).push();
        await ref.set(sessionData);

        const sessionId = ref.key;
        activeSession = {
            id: sessionId,
            ...sessionData
        };

        console.log('✅ Sesión QR creada:', sessionId);

        // Generar URL para compartir con estudiantes
        const qrUrl = `${window.location.origin}/scan?sessionId=${sessionId}`;
        console.log('🔗 URL de escaneo:', qrUrl);

        return {
            id: sessionId,
            url: qrUrl,
            data: sessionData
        };
    } catch (error) {
        console.error('❌ Error creando sesión QR:', error);
        alert('Error al crear sesión QR: ' + error.message);
        throw error;
    }
}

/**
 * Cerrar una sesión QR (dejar de aceptar asistencias)
 */
async function closeQRSession(sessionId) {
    if (!currentUser) return;

    try {
        await database.ref(`sessions/${sessionId}`).update({
            isActive: false,
            closedAt: new Date().toISOString()
        });

        console.log('✅ Sesión cerrada:', sessionId);
        unwatchQRSession();
        unwatchSessionAttendees();
    } catch (error) {
        console.error('❌ Error cerrando sesión:', error);
        alert('Error al cerrar sesión: ' + error.message);
        throw error;
    }
}

// ========== MONITOREAR SESIONES EN TIEMPO REAL ==========

/**
 * Cargar sesiones activas del docente
 */
async function loadUserSessions() {
    if (!currentUser) return;

    try {
        const teacherId = currentUser.uid;
        const snapshot = await database.ref('sessions')
            .orderByChild('teacherId')
            .equalTo(teacherId)
            .limitToLast(10)
            .once('value');

        const sessions = [];
        snapshot.forEach((childSnapshot) => {
            sessions.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        console.log('📋 Sesiones del docente:', sessions);
        renderSessions(sessions);

        return sessions;
    } catch (error) {
        console.error('❌ Error cargando sesiones:', error);
        throw error;
    }
}

/**
 * Monitorear una sesión QR específica en tiempo real
 */
function watchQRSession(sessionId, callback) {
    if (sessionListener) {
        sessionListener();
    }

    const ref = database.ref(`sessions/${sessionId}`);
    const listener = ref.on('value', (snapshot) => {
        if (snapshot.exists()) {
            activeSession = {
                id: sessionId,
                ...snapshot.val()
            };
            console.log('🔄 Sesión actualizada:', activeSession);
            if (callback) callback(activeSession);
        }
    });

    sessionListener = () => ref.off('value');
    return sessionListener;
}

/**
 * Desuscribirse del listener de sesión
 */
function unwatchQRSession() {
    if (sessionListener) {
        sessionListener();
        sessionListener = null;
    }
}

// ========== MONITOREAR ASISTENCIA EN TIEMPO REAL ==========

/**
 * Escuchar cambios en la lista de asistentes en tiempo real
 */
function watchSessionAttendees(sessionId, callback) {
    if (attendeesListener) {
        attendeesListener();
    }

    const path = `sessions/${sessionId}/attendees`;
    const ref = database.ref(path);

    const listener = ref.on('value', (snapshot) => {
        const attendees = [];
        snapshot.forEach((childSnapshot) => {
            attendees.push({
                studentId: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        console.log('👥 Lista de asistencia actualizada:', attendees);
        updateAttendeesList(attendees);
        if (callback) callback(attendees);
    });

    attendeesListener = () => ref.off('value');
    return attendeesListener;
}

/**
 * Escuchar cuando un nuevo estudiante marca asistencia (evento específico)
 */
function watchNewAttendees(sessionId, callback) {
    const path = `sessions/${sessionId}/attendees`;
    const ref = database.ref(path);

    const listener = ref.on('child_added', (snapshot) => {
        const attendee = {
            studentId: snapshot.key,
            ...snapshot.val()
        };

        console.log('✅ Nuevo asistente:', attendee);
        if (callback) callback(attendee);
    });

    return () => ref.off('child_added');
}

/**
 * Desuscribirse del listener de asistentes
 */
function unwatchSessionAttendees() {
    if (attendeesListener) {
        attendeesListener();
        attendeesListener = null;
    }
}

// ========== RENDERIZAR DATOS EN EL DOM ==========

/**
 * Renderizar lista de sesiones
 */
function renderSessions(sessions) {
    const container = document.getElementById('sessions-list');
    if (!container) return;

    container.innerHTML = '';

    if (sessions.length === 0) {
        container.innerHTML = '<p>No hay sesiones activas</p>';
        return;
    }

    sessions.forEach((session) => {
        const isActive = session.isActive;
        const attendeeCount = session.attendees ? Object.keys(session.attendees).length : 0;

        const card = document.createElement('div');
        card.className = 'session-card';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h3 style="color: var(--primary-color); margin-bottom: 0.25rem;">
                        Sesión ${session.id.substring(0, 8)}...
                    </h3>
                    <p style="color: var(--text-secondary); font-size: 0.875rem;">
                        Curso: ${session.courseId}
                    </p>
                    <p style="color: var(--success-color); font-size: 0.875rem; font-weight: 600;">
                        👥 Asistentes: ${attendeeCount}
                    </p>
                    <p style="color: var(--text-secondary); font-size: 0.75rem;">
                        ${new Date(session.createdAt).toLocaleString('es-ES')}
                    </p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="viewSessionDetails('${session.id}')" style="background: var(--primary-color); color: white; border: none; padding: 0.5rem 0.75rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
                        📊 Ver
                    </button>
                    ${isActive ? `
                        <button onclick="closeQRSession('${session.id}')" style="background: var(--error-color); color: white; border: none; padding: 0.5rem 0.75rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
                            ⛔ Cerrar
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

/**
 * Actualizar lista de asistentes en el DOM
 */
function updateAttendeesList(attendees) {
    const container = document.getElementById('attendees-list');
    if (!container) return;

    container.innerHTML = '';

    if (attendees.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Esperando asistentes...</p>';
        return;
    }

    attendees.forEach((attendee) => {
        const row = document.createElement('div');
        row.className = 'attendee-row';
        row.innerHTML = `
            <div style="padding: 0.75rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong style="color: var(--text-primary);">${attendee.studentName || attendee.studentId}</strong><br>
                    <small style="color: var(--text-secondary);">ID: ${attendee.studentId}</small><br>
                    <small style="color: var(--text-muted); font-size: 0.75rem;">
                        ${new Date(attendee.timestamp).toLocaleTimeString('es-ES')}
                    </small>
                </div>
                <span style="color: var(--success-color); font-weight: 600;">✅</span>
            </div>
        `;
        container.appendChild(row);
    });
}

/**
 * Ver detalles de una sesión
 */
async function viewSessionDetails(sessionId) {
    try {
        const snapshot = await database.ref(`sessions/${sessionId}`).once('value');
        if (snapshot.exists()) {
            const session = snapshot.val();
            const attendeeCount = session.attendees ? Object.keys(session.attendees).length : 0;

            // Mostrar detalles en una alerta o modal
            alert(`
Sesión: ${sessionId}
Curso: ${session.courseId}
Docente: ${session.teacherName}
Asistentes: ${attendeeCount}
Duración: ${session.duration} minutos
Creado: ${new Date(session.createdAt).toLocaleString('es-ES')}
Estado: ${session.isActive ? 'ACTIVA' : 'CERRADA'}
            `);

            // Cargar y monitorear esta sesión
            watchQRSession(sessionId);
            watchSessionAttendees(sessionId);
        }
    } catch (error) {
        console.error('❌ Error obteniendo detalles de sesión:', error);
        alert('Error al obtener detalles de la sesión');
    }
}

// ========== OBTENER REPORTE DE ASISTENCIA ==========

/**
 * Obtener reporte de asistencia de una sesión
 */
async function getSessionReport(sessionId) {
    try {
        const snapshot = await database.ref(`sessions/${sessionId}/attendees`).once('value');
        const attendees = [];
        snapshot.forEach((childSnapshot) => {
            attendees.push({
                studentId: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        return {
            sessionId: sessionId,
            totalAttendees: attendees.length,
            attendees: attendees,
            generatedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('❌ Error generando reporte:', error);
        throw error;
    }
}

/**
 * Exportar reporte a CSV
 */
async function exportReportToCSV(sessionId) {
    try {
        const report = await getSessionReport(sessionId);

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Estudiante ID,Nombre,DNI,Hora de Escaneo\n";

        report.attendees.forEach((attendee) => {
            const row = `${attendee.studentId},"${attendee.studentName || 'N/A'}","${attendee.studentDni || 'N/A'}","${new Date(attendee.timestamp).toLocaleString('es-ES')}"`;
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_asistencia_${sessionId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log('✅ Reporte exportado a CSV');
    } catch (error) {
        console.error('❌ Error exportando reporte:', error);
        alert('Error al exportar reporte: ' + error.message);
    }
}

// ========== GESTIÓN DE ESTUDIANTES EN TIEMPO REAL ==========

let studentsListener = null;

/**
 * Escuchar cambios en la lista de estudiantes en tiempo real
 */
function watchStudentsList(callback) {
    if (studentsListener) {
        studentsListener(); // Desuscribirse del listener anterior
    }

    const ref = database.ref('students');
    const listener = ref.on('value', (snapshot) => {
        const students = [];
        snapshot.forEach((childSnapshot) => {
            students.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        console.log('👥 Lista de estudiantes actualizada:', students);
        if (callback) callback(students);
    });

    studentsListener = () => ref.off('value');
    return studentsListener;
}

/**
 * Desuscribirse del listener de estudiantes
 */
function unwatchStudentsList() {
    if (studentsListener) {
        studentsListener();
        studentsListener = null;
    }
}

/**
 * Obtener lista de estudiantes
 */
async function getStudentsList() {
    try {
        const snapshot = await database.ref('students').once('value');
        const students = [];
        snapshot.forEach((childSnapshot) => {
            students.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        return students;
    } catch (error) {
        console.error('❌ Error obteniendo lista de estudiantes:', error);
        throw error;
    }
}

// Exponer funciones globales
window.createQRSession = createQRSession;
window.closeQRSession = closeQRSession;
window.loadUserSessions = loadUserSessions;
window.watchQRSession = watchQRSession;
window.unwatchQRSession = unwatchQRSession;
window.watchSessionAttendees = watchSessionAttendees;
window.watchNewAttendees = watchNewAttendees;
window.unwatchSessionAttendees = unwatchSessionAttendees;
window.viewSessionDetails = viewSessionDetails;
window.getSessionReport = getSessionReport;
window.exportReportToCSV = exportReportToCSV;
window.watchStudentsList = watchStudentsList;
window.unwatchStudentsList = unwatchStudentsList;
window.getStudentsList = getStudentsList;

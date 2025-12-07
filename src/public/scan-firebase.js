// Scan Firebase Realtime Database Integration
// Script para registrar asistencia del estudiante en tiempo real

let firebaseConfig = null;
let database = null;

// Cargar configuración de Firebase desde el servidor
async function loadFirebaseConfig() {
    try {
        const response = await fetch('/api/config/firebase');
        if (!response.ok) throw new Error('Failed to load Firebase config');
        firebaseConfig = await response.json();
        
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        database = firebase.database();
        console.log('✅ Firebase initialized from server config');
    } catch (error) {
        console.error('Error loading Firebase config:', error);
        throw error;
    }
}

// Cargar configuración cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    loadFirebaseConfig().catch(error => {
        console.error('Fatal error:', error);
        alert('Error al cargar configuración. Por favor recarga la página.');
    });
});

// ========== VARIABLES GLOBALES ==========
let currentSession = null;
let sessionListener = null;

// ========== FUNCIONES PARA REGISTRAR DATOS DEL ESTUDIANTE ==========

/**
 * Guardar datos del estudiante en localStorage y Firebase (opcional)
 */
function saveStudentData(studentData) {
    const { studentId, name, dni, phone } = studentData;

    // Guardar en localStorage
    localStorage.setItem('studentId', studentId);
    localStorage.setItem('studentName', name);
    localStorage.setItem('studentDni', dni || '');
    localStorage.setItem('studentPhone', phone || '');

    // Opcionalmente, también guardar en Firebase
    if (studentId) {
        const studentPath = `students/${studentId}`;
        database.ref(studentPath).set({
            id: studentId,
            name: name,
            dni: dni || '',
            phone: phone || '',
            lastScanAt: new Date().toISOString()
        }).catch(error => {
            console.error('Error guardando datos del estudiante en Firebase:', error);
        });
    }

    console.log('✅ Datos del estudiante guardados');
}

// ========== FUNCIONES PARA ESCUCHAR SESIONES EN TIEMPO REAL ==========

/**
 * Escuchar cambios en una sesión QR específica
 */
function watchQRSession(sessionId, callback) {
    if (sessionListener) {
        sessionListener(); // Desuscribirse del listener anterior
    }

    const sessionPath = `sessions/${sessionId}`;
    const ref = database.ref(sessionPath);

    const listener = ref.on('value', (snapshot) => {
        if (snapshot.exists()) {
            currentSession = {
                id: sessionId,
                ...snapshot.val()
            };
            console.log('🔄 Sesión QR actualizada:', currentSession);
            if (callback) callback(currentSession);
        } else {
            console.log('⚠️ Sesión no encontrada');
        }
    });

    // Guardar referencia para desuscribirse después
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

// ========== FUNCIONES PARA REGISTRAR ASISTENCIA EN FIREBASE ==========

/**
 * Registrar asistencia en Firebase (método 1: directamente en la sesión)
 */
async function recordAttendanceInSession(sessionId, studentData) {
    try {
        const { studentId, name, dni } = studentData;
        const attendeeData = {
            studentId: studentId,
            studentName: name,
            studentDni: dni || '',
            timestamp: new Date().toISOString()
        };

        // Guardar en la sesión
        await database.ref(`sessions/${sessionId}/attendees/${studentId}`).set(attendeeData);
        console.log('✅ Asistencia registrada en sesión:', attendeeData);

        return attendeeData;
    } catch (error) {
        console.error('❌ Error registrando asistencia en sesión:', error);
        throw error;
    }
}

/**
 * Registrar asistencia en Firebase (método 2: en tabla de asistencia global)
 */
async function recordAttendanceInDB(courseId, studentData) {
    try {
        const { studentId, name, dni } = studentData;
        const attendanceData = {
            studentId: studentId,
            courseId: courseId,
            studentName: name,
            studentDni: dni || '',
            timestamp: new Date().toISOString()
        };

        // Guardar en la tabla de asistencia
        const ref = database.ref('attendance').push();
        await ref.set(attendanceData);
        console.log('✅ Asistencia registrada globalmente:', attendanceData);

        return { id: ref.key, ...attendanceData };
    } catch (error) {
        console.error('❌ Error registrando asistencia:', error);
        throw error;
    }
}

// ========== FUNCIONES PARA ESCUCHAR CAMBIOS EN ASISTENCIA ==========

/**
 * Escuchar la lista de asistencia de una sesión en tiempo real
 */
function watchSessionAttendees(sessionId, callback) {
    const path = `sessions/${sessionId}/attendees`;
    const ref = database.ref(path);

    const listener = ref.on('value', (snapshot) => {
        const attendees = [];
        snapshot.forEach((childSnapshot) => {
            attendees.push({
                key: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        console.log('👥 Lista de asistencia actualizada:', attendees);
        if (callback) callback(attendees);
    });

    return () => ref.off('value');
}

/**
 * Escuchar cambios nuevos en asistencia (solo eventos nuevos)
 */
function watchAttendanceAdded(callback) {
    const ref = database.ref('attendance');

    const listener = ref.on('child_added', (snapshot) => {
        const record = {
            id: snapshot.key,
            ...snapshot.val()
        };

        console.log('📝 Nuevo registro de asistencia:', record);
        if (callback) callback(record);
    });

    return () => ref.off('child_added');
}

// ========== OBTENER DATOS DE SESIÓN ==========

/**
 * Obtener información de una sesión QR
 */
async function getSessionInfo(sessionId) {
    try {
        const snapshot = await database.ref(`sessions/${sessionId}`).once('value');
        if (snapshot.exists()) {
            const sessionData = {
                id: sessionId,
                ...snapshot.val()
            };
            console.log('📋 Información de sesión:', sessionData);
            return sessionData;
        } else {
            console.log('⚠️ Sesión no encontrada:', sessionId);
            return null;
        }
    } catch (error) {
        console.error('❌ Error obteniendo información de sesión:', error);
        throw error;
    }
}

/**
 * Obtener lista de asistencia de una sesión
 */
async function getSessionAttendees(sessionId) {
    try {
        const snapshot = await database.ref(`sessions/${sessionId}/attendees`).once('value');
        const attendees = [];
        snapshot.forEach((childSnapshot) => {
            attendees.push({
                key: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        console.log('👥 Lista de asistencia:', attendees);
        return attendees;
    } catch (error) {
        console.error('❌ Error obteniendo asistencia:', error);
        throw error;
    }
}

// ========== VALIDAR ASISTENCIA ==========

/**
 * Verificar si un estudiante ya marcó asistencia en una sesión
 */
async function hasStudentScanned(sessionId, studentId) {
    try {
        const snapshot = await database.ref(`sessions/${sessionId}/attendees/${studentId}`).once('value');
        return snapshot.exists();
    } catch (error) {
        console.error('❌ Error verificando asistencia:', error);
        throw error;
    }
}

// Exponer funciones globales
window.saveStudentData = saveStudentData;
window.watchQRSession = watchQRSession;
window.unwatchQRSession = unwatchQRSession;
window.recordAttendanceInSession = recordAttendanceInSession;
window.recordAttendanceInDB = recordAttendanceInDB;
window.watchSessionAttendees = watchSessionAttendees;
window.watchAttendanceAdded = watchAttendanceAdded;
window.getSessionInfo = getSessionInfo;
window.getSessionAttendees = getSessionAttendees;
window.hasStudentScanned = hasStudentScanned;

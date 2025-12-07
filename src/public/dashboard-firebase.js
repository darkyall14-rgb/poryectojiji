// Dashboard Firebase Realtime Database Integration
// Este script maneja la integración en tiempo real con Firebase para el dashboard
// Nota: auth y database se inicializan en script.js de forma asíncrona

// ========== VARIABLES GLOBALES ==========
let firebaseListeners = {}; // Almacenar referencias de listeners para poder desuscribirse

// ========== INICIALIZACIÓN ==========

// Esperar a que Firebase esté inicializado antes de usar auth
function initializeDashboardListeners() {
    if (!window.auth) {
        console.warn('⚠️ Firebase no está inicializado aún, esperando...');
        setTimeout(initializeDashboardListeners, 500); // Reintentar en 500ms
        return;
    }
    
    // Inicializar listeners cuando el usuario inicia sesión
    window.auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            console.log('✅ Usuario autenticado:', user.email);
            
            // Iniciar listeners de tiempo real
            initializeRealtimeListeners();
        } else {
            currentUser = null;
            console.log('❌ Usuario no autenticado');
            
            // Desuscribirse de todos los listeners
            unsubscribeAllListeners();
        }
    });
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboardListeners();
});

// ========== FUNCIONES DE LISTENERS EN TIEMPO REAL ==========

/**
 * Inicializar todos los listeners para datos en tiempo real
 */
function initializeRealtimeListeners() {
    if (!currentUser) return;

    const uid = currentUser.uid;

    // 1. Escuchar cambios en estudiantes
    listenToStudents(uid);

    // 2. Escuchar cambios en cursos
    listenToCourses(uid);

    // 3. Escuchar cambios en asistencia
    listenToAttendance(uid);

    console.log('🔄 Listeners de tiempo real inicializados');
}

/**
 * Escuchar cambios en la lista de estudiantes en tiempo real
 */
function listenToStudents(uid) {
    const path = `teachers/${uid}/students`;
    
    if (firebaseListeners['students']) {
        firebaseListeners['students'](); // Desuscribirse del listener anterior
    }

    const ref = database.ref(path);
    const listener = ref.on('value', (snapshot) => {
        students = [];
        snapshot.forEach((childSnapshot) => {
            students.push({
                key: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        console.log('📊 Estudiantes actualizados (en vivo):', students);
        
        // Actualizar el DOM
        renderStudentsInDashboard();
        updateStudentsStats();
    });

    // Guardar referencia para desuscribirse después
    firebaseListeners['students'] = () => ref.off('value');
}

/**
 * Escuchar cambios en la lista de cursos en tiempo real
 */
function listenToCourses(uid) {
    const path = `teachers/${uid}/courses`;
    
    if (firebaseListeners['courses']) {
        firebaseListeners['courses']();
    }

    const ref = database.ref(path);
    const listener = ref.on('value', (snapshot) => {
        courses = [];
        snapshot.forEach((childSnapshot) => {
            courses.push({
                key: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        console.log('📚 Cursos actualizados (en vivo):', courses);
        
        // Actualizar el DOM
        renderCoursesInDashboard();
        updateCoursesStats();
    });

    firebaseListeners['courses'] = () => ref.off('value');
}

/**
 * Escuchar cambios en la asistencia en tiempo real (ahora desde las sesiones activas)
 */
function listenToAttendance(uid) {
    const path = `sessions`;
    
    if (firebaseListeners['attendance']) {
        firebaseListeners['attendance']();
    }

    const ref = database.ref(path);
    const listener = ref.on('value', (snapshot) => {
        attendance = [];
        const sessionsData = snapshot.val();
        
        if (sessionsData) {
            Object.values(sessionsData).forEach((session) => {
                // Solo procesar sesiones de este docente
                if (session.teacherId === uid && session.attendees) {
                    const attendeesData = session.attendees;
                    
                    // Convertir attendees (puede ser array u objeto) a items individuales
                    if (Array.isArray(attendeesData)) {
                        attendeesData.forEach((att) => {
                            attendance.push({
                                key: att.studentId || att.id,
                                ...att,
                                sessionId: session.sessionId
                            });
                        });
                    } else if (typeof attendeesData === 'object') {
                        Object.entries(attendeesData).forEach(([key, att]) => {
                            attendance.push({
                                key: key,
                                ...att,
                                sessionId: session.sessionId
                            });
                        });
                    }
                }
            });
        }

        console.log('📝 Registros de asistencia actualizados (en vivo):', attendance);
        
        // Actualizar el DOM
        updateAttendanceStats();
    });

    firebaseListeners['attendance'] = () => ref.off('value');
}

// ========== FUNCIONES DE DESUSCRIPCIÓN ==========

/**
 * Desuscribirse de todos los listeners
 */
function unsubscribeAllListeners() {
    Object.keys(firebaseListeners).forEach((key) => {
        try {
            firebaseListeners[key]();
            console.log(`✅ Desuscrito de listener: ${key}`);
        } catch (error) {
            console.error(`Error desuscribiendo ${key}:`, error);
        }
    });
    firebaseListeners = {};
}

// ========== FUNCIONES DE RENDERIZADO ==========

/**
 * Renderizar estudiantes en el dashboard
 */
function renderStudentsInDashboard() {
    const container = document.getElementById('studentsGrid');
    if (!container) return;

    container.innerHTML = '';

    if (students.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No hay estudiantes registrados</p>';
        return;
    }

    students.forEach((student) => {
        const card = document.createElement('div');
        card.className = 'student-card';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h3 style="color: var(--text-primary); margin-bottom: 0.25rem;">${student.name || 'Sin nombre'}</h3>
                    <p style="color: var(--text-secondary); font-size: 0.875rem; margin: 0.25rem 0;">Email: ${student.email || 'N/A'}</p>
                    <p style="color: var(--text-secondary); font-size: 0.875rem;">ID: ${student.studentId || 'N/A'}</p>
                </div>
                <button onclick="editStudent('${student.key}')" style="background: var(--primary-color); color: white; border: none; padding: 0.5rem 0.75rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

/**
 * Renderizar cursos en el dashboard
 */
function renderCoursesInDashboard() {
    const container = document.getElementById('coursesGrid');
    if (!container) return;

    container.innerHTML = '';

    if (courses.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No hay cursos registrados</p>';
        return;
    }

    courses.forEach((course) => {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h3 style="color: var(--primary-color); margin-bottom: 0.25rem;">${course.name || 'Sin nombre'}</h3>
                    <p style="color: var(--text-secondary); font-size: 0.875rem; margin: 0.25rem 0;">Código: ${course.code || 'N/A'}</p>
                    <p style="color: var(--text-secondary); font-size: 0.875rem; margin: 0.25rem 0;">Horario: ${course.schedule || 'N/A'}</p>
                    <p style="color: var(--text-secondary); font-size: 0.875rem;">${course.description || ''}</p>
                </div>
                <button onclick="editCourse('${course.key}')" style="background: var(--secondary-color); color: white; border: none; padding: 0.5rem 0.75rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// ========== FUNCIONES DE ESTADÍSTICAS ==========

/**
 * Actualizar estadísticas de estudiantes
 */
function updateStudentsStats() {
    const totalStudentsEl = document.getElementById('totalStudents');
    if (totalStudentsEl) {
        totalStudentsEl.textContent = students.length;
    }
}

/**
 * Actualizar estadísticas de cursos
 */
function updateCoursesStats() {
    const totalCoursesEl = document.getElementById('totalCourses');
    if (totalCoursesEl) {
        totalCoursesEl.textContent = courses.length;
    }
}

/**
 * Actualizar estadísticas de asistencia
 */
function updateAttendanceStats() {
    if (attendance.length === 0) {
        const todayAttendanceEl = document.getElementById('todayAttendance');
        if (todayAttendanceEl) todayAttendanceEl.textContent = '0%';
        return;
    }

    // Calcular asistencia de hoy
    const today = new Date().toDateString();
    const todayAttendance = attendance.filter((rec) => {
        const recDate = new Date(rec.timestamp).toDateString();
        return recDate === today;
    });

    const percentage = students.length > 0 
        ? Math.round((todayAttendance.length / students.length) * 100) 
        : 0;

    const todayAttendanceEl = document.getElementById('todayAttendance');
    if (todayAttendanceEl) {
        todayAttendanceEl.textContent = percentage + '%';
    }

    // Calcular promedio general
    if (attendance.length > 0 && students.length > 0) {
        const avgPercentage = Math.round((attendance.length / (students.length * 10)) * 100); // Asumiendo 10 días
        const avgAttendanceEl = document.getElementById('avgAttendance');
        if (avgAttendanceEl) {
            avgAttendanceEl.textContent = Math.min(avgPercentage, 100) + '%';
        }
    }
}

// ========== FUNCIONES DE CREAR/EDITAR (con Firebase) ==========

/**
 * Agregar estudiante a Firebase
 */
async function addStudentToFirebase(studentData) {
    if (!currentUser) {
        alert('Debes iniciar sesión primero');
        return;
    }

    try {
        const uid = currentUser.uid;
        const ref = database.ref(`teachers/${uid}/students`).push();
        
        const student = {
            name: studentData.name,
            email: studentData.email,
            studentId: studentData.studentId,
            phone: studentData.phone,
            createdAt: new Date().toISOString()
        };

        await ref.set(student);
        console.log('✅ Estudiante agregado a Firebase:', student);
        
        // Limpiar formulario
        document.getElementById('addStudentForm').reset();
        closeModal('addStudentModal');
        
        // El listener actualizará el DOM automáticamente
    } catch (error) {
        console.error('❌ Error al agregar estudiante:', error);
        alert('Error al agregar estudiante: ' + error.message);
    }
}

/**
 * Editar estudiante en Firebase
 */
async function editStudent(studentKey) {
    if (!currentUser) return;

    const student = students.find(s => s.key === studentKey);
    if (!student) return;

    // Rellenar formulario con datos del estudiante
    document.getElementById('studentName').value = student.name;
    document.getElementById('studentId').value = student.studentId;
    document.getElementById('studentEmail').value = student.email;
    document.getElementById('studentPhone').value = student.phone;

    // Mostrar modal
    showAddStudentModal();

    // Al hacer submit, actualizar en lugar de crear
    document.getElementById('addStudentForm').onsubmit = async (e) => {
        e.preventDefault();
        
        try {
            const uid = currentUser.uid;
            await database.ref(`teachers/${uid}/students/${studentKey}`).update({
                name: document.getElementById('studentName').value,
                studentId: document.getElementById('studentId').value,
                email: document.getElementById('studentEmail').value,
                phone: document.getElementById('studentPhone').value,
                updatedAt: new Date().toISOString()
            });

            console.log('✅ Estudiante actualizado en Firebase');
            closeModal('addStudentModal');
            document.getElementById('addStudentForm').onsubmit = null; // Restaurar comportamiento normal
        } catch (error) {
            console.error('❌ Error al actualizar estudiante:', error);
            alert('Error al actualizar estudiante: ' + error.message);
        }
    };
}

/**
 * Agregar curso a Firebase
 */
async function addCourseToFirebase(courseData) {
    if (!currentUser) {
        alert('Debes iniciar sesión primero');
        return;
    }

    try {
        const uid = currentUser.uid;
        const ref = database.ref(`teachers/${uid}/courses`).push();
        
        const course = {
            name: courseData.name,
            code: courseData.code,
            description: courseData.description,
            schedule: courseData.schedule,
            teacher: currentUser.email,
            createdAt: new Date().toISOString()
        };

        await ref.set(course);
        console.log('✅ Curso agregado a Firebase:', course);
        
        // Limpiar formulario
        document.getElementById('addCourseForm').reset();
        closeModal('addCourseModal');
        
        // El listener actualizará el DOM automáticamente
    } catch (error) {
        console.error('❌ Error al agregar curso:', error);
        alert('Error al agregar curso: ' + error.message);
    }
}

/**
 * Editar curso en Firebase
 */
async function editCourse(courseKey) {
    if (!currentUser) return;

    const course = courses.find(c => c.key === courseKey);
    if (!course) return;

    // Rellenar formulario con datos del curso
    document.getElementById('courseName').value = course.name;
    document.getElementById('courseDescription').value = course.description;
    document.getElementById('courseSchedule').value = course.schedule;

    // Mostrar modal
    showAddCourseModal();

    // Al hacer submit, actualizar en lugar de crear
    document.getElementById('addCourseForm').onsubmit = async (e) => {
        e.preventDefault();
        
        try {
            const uid = currentUser.uid;
            await database.ref(`teachers/${uid}/courses/${courseKey}`).update({
                name: document.getElementById('courseName').value,
                description: document.getElementById('courseDescription').value,
                schedule: document.getElementById('courseSchedule').value,
                updatedAt: new Date().toISOString()
            });

            console.log('✅ Curso actualizado en Firebase');
            closeModal('addCourseModal');
            document.getElementById('addCourseForm').onsubmit = null; // Restaurar comportamiento normal
        } catch (error) {
            console.error('❌ Error al actualizar curso:', error);
            alert('Error al actualizar curso: ' + error.message);
        }
    };
}

// Exponer funciones globales para que se usen en el HTML
window.addStudentToFirebase = addStudentToFirebase;
window.addCourseToFirebase = addCourseToFirebase;
window.editStudent = editStudent;
window.editCourse = editCourse;

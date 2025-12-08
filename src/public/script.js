// Cargar configuración de Firebase desde el servidor
let firebaseConfig = null;
let auth = null;
let database = null;

async function loadFirebaseConfig() {
    try {
        const response = await fetch('/api/config/firebase');
        if (!response.ok) throw new Error('Failed to load Firebase config');
        firebaseConfig = await response.json();
        
        // Inicializar Firebase
        firebase.initializeApp(firebaseConfig);
        
        // Asignar referencias globales
        auth = firebase.auth();
        database = firebase.database();
        
        // Exponer en window para otros scripts
        window.auth = auth;
        window.database = database;
        // Emitir evento para indicar que Firebase ya fue inicializado
        try {
            window.dispatchEvent(new Event('firebase-initialized'));
        } catch (e) {
            console.debug('No se pudo dispatch event firebase-initialized:', e);
        }
        
        console.log('✅ Firebase initialized from server config');
    } catch (error) {
        console.error('Error loading Firebase config:', error);
        throw error;
    }
}

// Variables globales
let currentUser = null;
let students = [];
let courses = [];
let attendanceRecords = [];
let editingStudentKey = null;
let editingCourseId = null;
let cameraStream = null;
let scanInterval = null;
let qrScannerEnabled = false;
let currentYear = new Date().getFullYear();

// API helper with retry logic for 502 errors
async function apiFetch(path, options = {}, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const resp = await fetch(path, {
                headers: { 'Content-Type': 'application/json' },
                ...options,
            });
            if (!resp.ok) {
                // 502 means server not ready, retry after delay
                if (resp.status === 502 && attempt < retries) {
                    console.warn(`[apiFetch] 502 on ${path}, retrying (${attempt}/${retries})...`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // exponential backoff
                    continue;
                }
                throw new Error(`HTTP ${resp.status}`);
            }
            if (resp.status === 204) return null;
            return resp.json();
        } catch (error) {
            if (attempt === retries) {
                throw error;
            }
            console.warn(`[apiFetch] Error on ${path}, retrying (${attempt}/${retries})...`, error.message);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    // Cargar configuración de Firebase primero
    loadFirebaseConfig().then(() => {
        initializeApp();
        setupEventListeners();
        updateDateTime();
        setInterval(updateDateTime, 1000);
    }).catch(error => {
        console.error('Fatal error loading Firebase config:', error);
        document.body.innerHTML = '<div style="padding: 2rem; color: red;">Error de configuración. Por favor recarga la página.</div>';
    });
});

// Inicializar la aplicación
function initializeApp() {
    // Verificar si hay un usuario autenticado
    auth.onAuthStateChanged((user) => {
        // Toggle visibility of Generate QR button in header
        const genBtn = document.getElementById('generateQrBtn');
        if (genBtn) genBtn.style.display = user ? '' : 'none';

        const hasDashboard = !!document.getElementById('dashboardPage');

        if (user) {
            currentUser = user;
            if (hasDashboard) {
                showDashboard();
                loadUserData();
                // Iniciar listener de actualizaciones de asistencia
                watchAttendanceUpdates();
            }
        } else {
            currentUser = null;
            // Only attempt to show login if the login page exists
            const loginPage = document.getElementById('loginPage');
            if (loginPage) showLogin();
        }
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    // Add student form
    const addStudentForm = document.getElementById('addStudentForm');
    if (addStudentForm) addStudentForm.addEventListener('submit', handleAddStudent);

    // Add course form
    const addCourseForm = document.getElementById('addCourseForm');
    if (addCourseForm) addCourseForm.addEventListener('submit', handleAddCourse);

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target && event.target.classList && event.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

// Manejar login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        showDashboard();
        loadUserData();
        showNotification('Inicio de sesión exitoso', 'success');
    } catch (error) {
        showNotification('Error al iniciar sesión: ' + error.message, 'error');
    }
}

// Manejar registro
async function handleRegister(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const institution = document.getElementById('institution').value;
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        
        // Guardar información adicional del usuario
        await database.ref('teachers/' + currentUser.uid).set({
            fullName: fullName,
            email: email,
            institution: institution,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });

        // Crear unidades didácticas predefinidas
        const courses = [
            {
                name: "Algoritmos y Estructuras de Datos",
                description: "Fundamentos de algoritmos, complejidad computacional y estructuras de datos avanzadas",
                schedule: "Lunes y Miércoles 8:00-10:00",
                instructor: "Dr. García",
                room: "Aula 201"
            },
            {
                name: "Bases de Datos",
                description: "Diseño, implementación y administración de sistemas de gestión de bases de datos",
                schedule: "Martes y Jueves 10:00-12:00",
                instructor: "Dra. Martínez",
                room: "Laboratorio 3"
            },
            {
                name: "Desarrollo de Software",
                description: "Metodologías de desarrollo, patrones de diseño y arquitectura de software",
                schedule: "Viernes 14:00-17:00",
                instructor: "Ing. López",
                room: "Sala de Computación"
            }
        ];

        // Crear cada unidad didáctica
        for (const course of courses) {
            const courseRef = database.ref('teachers/' + currentUser.uid + '/courses').push();
            await courseRef.set({
                ...course,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                isDefault: true
            });
        }

        // Crear algunos estudiantes de ejemplo
        const sampleStudents = [
            {
                name: "Ana García",
                studentId: "2024001",
                email: "ana.garcia@estudiante.com",
                phone: "+57 300 123 4567"
            },
            {
                name: "Carlos López",
                studentId: "2024002",
                email: "carlos.lopez@estudiante.com",
                phone: "+57 300 234 5678"
            },
            {
                name: "María Rodríguez",
                studentId: "2024003",
                email: "maria.rodriguez@estudiante.com",
                phone: "+57 300 345 6789"
            },
            {
                name: "José Martínez",
                studentId: "2024004",
                email: "jose.martinez@estudiante.com",
                phone: "+57 300 456 7890"
            }
        ];

        // Crear cada estudiante de ejemplo
        for (const student of sampleStudents) {
            const studentRef = database.ref('teachers/' + currentUser.uid + '/students').push();
            await studentRef.set({
                ...student,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                isSample: true
            });
        }
        
        showDashboard();
        loadUserData();
        showNotification('Cuenta creada exitosamente', 'success');
    } catch (error) {
        showNotification('Error al crear cuenta: ' + error.message, 'error');
    }
}

// Cargar datos del usuario
async function loadUserData() {
    if (!currentUser) return;
    
    try {
        // Cargar información del profesor
        const teacherSnapshot = await database.ref('teachers/' + currentUser.uid).once('value');
        if (teacherSnapshot.exists()) {
            const teacherData = teacherSnapshot.val();
            const userNameEl = document.getElementById('userName');
            if (userNameEl) userNameEl.textContent = teacherData.fullName;
            const userEmailEl = document.getElementById('userEmail');
            if (userEmailEl) userEmailEl.textContent = teacherData.email;
        }
        
        // Cargar estudiantes
        await loadStudents();

        // Cargar cursos
        await loadCourses();

        // Cargar registros de asistencia
        await loadAttendanceRecords();

        // Actualizar estadísticas
        updateStats();
        
    } catch (error) {
        console.error('Error loading user data:', error);
        showNotification('Error al cargar datos', 'error');
    }
}

// Cargar estudiantes
async function loadStudents() {
    try {
        // Source of truth: Firebase (scoped by teacher)
        const snapshot = await database.ref('teachers/' + currentUser.uid + '/students').once('value');
        students = [];
        if (snapshot.exists()) {
            const studentsData = snapshot.val();
            Object.keys(studentsData).forEach(key => {
                students.push({ id: key, ...studentsData[key] });
            });
            renderStudents();
            return;
        }
        // If empty in Firebase, fallback to API
        try {
            const apiStudents = await apiFetch('/api/students');
            students = Array.isArray(apiStudents) ? apiStudents : [];
        } catch (_) {
            students = [];
        }
        renderStudents();
    } catch (fbError) {
        console.error('Error loading students:', fbError);
        try {
            const apiStudents = await apiFetch('/api/students');
            students = Array.isArray(apiStudents) ? apiStudents : [];
            renderStudents();
        } catch (apiErr) {
            console.error('Error loading students from API:', apiErr);
            students = [];
            renderStudents();
        }
    }
}

// Cargar cursos
async function loadCourses() {
    try {
        // Cargar desde la API (fuente de verdad)
        const apiCourses = await apiFetch('/api/courses');
        
        // Asegurar que sea un array
        if (Array.isArray(apiCourses)) {
            // Remover duplicados basado en ID
            const uniqueCourses = {};
            apiCourses.forEach(course => {
                if (!uniqueCourses[course.id]) {
                    uniqueCourses[course.id] = course;
                }
            });
            courses = Object.values(uniqueCourses);
        } else {
            courses = [];
        }
        
        renderCourses();
        updateCourseSelect();
    } catch (error) {
        console.error('Error loading courses from API:', error);
        // Fallback a Firebase si API falla
        try {
            const snapshot = await database.ref('teachers/' + currentUser.uid + '/courses').once('value');
            courses = [];
            if (snapshot.exists()) {
                const coursesData = snapshot.val();
                Object.keys(coursesData).forEach(key => {
                    courses.push({ id: key, ...coursesData[key] });
                });
            }
            renderCourses();
            updateCourseSelect();
        } catch (fbError) {
            console.error('Error loading courses from Firebase:', fbError);
            courses = [];
            renderCourses();
            updateCourseSelect();
        }
    }
}

// Cargar registros de asistencia
// Cargar registros de asistencia
async function loadAttendanceRecords() {
    try {
        // Try API all attendance
        const apiAttendance = await apiFetch('/api/attendance');
        attendanceRecords = Array.isArray(apiAttendance) ? apiAttendance : [];
        renderAttendanceCalendar();
        // Cargar asistencia del día actual
        loadTodayAttendance();
    } catch (error) {
        try {
            const snapshot = await database.ref('teachers/' + currentUser.uid + '/attendance').once('value');
            attendanceRecords = [];
            if (snapshot.exists()) {
                const attendanceData = snapshot.val();
                Object.keys(attendanceData).forEach(key => {
                    attendanceRecords.push({ id: key, ...attendanceData[key] });
                });
            }
            renderAttendanceCalendar();
            loadTodayAttendance();
        } catch (fbError) {
            console.error('Error loading attendance records:', fbError);
            attendanceRecords = [];
            renderAttendanceCalendar();
        }
    }
}

// ========== FUNCIONES PARA MOSTRAR ASISTENCIA POR FECHA ==========

/**
 * Cargar y mostrar asistencia de hoy
 */
async function loadTodayAttendance() {
    const today = new Date();
    const todayDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Establecer el valor del input de fecha a hoy
    const dateInput = document.getElementById('attendanceDateFilter');
    if (dateInput) {
        dateInput.value = todayDate;
    }
    
    // Filtrar y mostrar asistencia de hoy
    filterAttendanceByDate(todayDate);
}

/**
 * Filtrar asistencia por fecha
 */
async function filterAttendanceByDate(selectedDate = null) {
    const dateInput = document.getElementById('attendanceDateFilter');
    const filterDate = selectedDate || (dateInput ? dateInput.value : null);
    
    if (!filterDate) {
        showTodayAttendanceByDefault();
        return;
    }

    try {
        // Obtener todas las sesiones y sus asistentes (with retry)
        const response = await apiFetch('/api/sessions');
        
        let sessionsData = response;
        
        // Asegurar que sea un array
        if (typeof sessionsData === 'object' && !Array.isArray(sessionsData) && sessionsData !== null) {
            sessionsData = Object.values(sessionsData);
        }
        
        if (!Array.isArray(sessionsData)) {
            console.error('Invalid sessions data:', sessionsData);
            renderTodayAttendance([]);
            return;
        }

        // Filtrar asistencia de la fecha seleccionada
        const attendanceToday = [];
        
        sessionsData.forEach((session) => {
            if (!session) return;
            
            if (session.attendees && Array.isArray(session.attendees)) {
                session.attendees.forEach((attendee) => {
                    if (!attendee.markedAt) return;
                    // Comparar fechas
                    const attendeeDate = new Date(attendee.markedAt).toISOString().split('T')[0];
                    
                    if (attendeeDate === filterDate) {
                        attendanceToday.push({
                            studentName: attendee.studentName,
                            studentId: attendee.studentId,
                            studentEmail: attendee.studentEmail,
                            studentPhone: attendee.studentPhone,
                            courseName: session.courseName,
                            courseId: session.courseId,
                            markedAt: attendee.markedAt,
                            sessionId: session.sessionId
                        });
                    }
                });
            } else if (session.attendees && typeof session.attendees === 'object') {
                // Si es un objeto, convertir a array
                Object.values(session.attendees).forEach((attendee) => {
                    if (!attendee || !attendee.markedAt) return;
                    
                    const attendeeDate = new Date(attendee.markedAt).toISOString().split('T')[0];
                    
                    if (attendeeDate === filterDate) {
                        attendanceToday.push({
                            studentName: attendee.studentName,
                            studentId: attendee.studentId,
                            studentEmail: attendee.studentEmail,
                            studentPhone: attendee.studentPhone,
                            courseName: session.courseName,
                            courseId: session.courseId,
                            markedAt: attendee.markedAt,
                            sessionId: session.sessionId
                        });
                    }
                });
            }
        });

        renderTodayAttendance(attendanceToday);
    } catch (error) {
        console.error('Error loading attendance:', error);
        // Show user-friendly error with retry suggestion
        const todayList = document.getElementById('todayAttendanceList');
        if (todayList) {
            todayList.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: var(--text-secondary); grid-column: 1/-1; background: var(--card-bg); border-radius: 8px; border: 1px solid var(--border-color);">
                    <i class="fas fa-exclamation-triangle" style="color: var(--warning-color); font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                    <p style="margin-bottom: 1rem;">Servidor temporalmente no disponible</p>
                    <small style="color: var(--text-secondary);">Por favor, intenta recargar la página en unos segundos</small>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Recargar página
                    </button>
                </div>
            `;
        }
        renderTodayAttendance([]);
    }
}

/**
 * Mostrar asistencia de hoy por defecto
 */
function showTodayAttendanceByDefault() {
    const today = new Date();
    const todayDate = today.toISOString().split('T')[0];
    filterAttendanceByDate(todayDate);
}

/**
 * Renderizar lista de asistencia del día
 */
function renderTodayAttendance(attendanceList) {
    const container = document.getElementById('todayAttendanceList');
    if (!container) return;

    if (!attendanceList || attendanceList.length === 0) {
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-secondary); grid-column: 1/-1;"><i class="fas fa-inbox" style="font-size: 2rem; display: block; margin-bottom: 1rem;"></i>No hay registros de asistencia para este día</div>';
        return;
    }

    container.innerHTML = '';
    
    // Agrupar por curso
    const groupedByCourse = {};
    attendanceList.forEach((att) => {
        const courseKey = att.courseId || 'sin-curso';
        if (!groupedByCourse[courseKey]) {
            groupedByCourse[courseKey] = {
                courseName: att.courseName || 'Sin nombre',
                students: []
            };
        }
        groupedByCourse[courseKey].students.push(att);
    });

    // Renderizar cada curso con sus estudiantes
    Object.entries(groupedByCourse).forEach(([courseId, courseData]) => {
        courseData.students.forEach((att, index) => {
            const card = document.createElement('div');
            card.style.cssText = 'background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--border-radius); padding: 1.25rem; border-left: 4px solid var(--primary-color); transition: var(--transition);';
            
            const time = new Date(att.markedAt).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                    <div>
                        <h4 style="color: var(--text-primary); margin: 0 0 0.5rem 0; font-size: 1rem;">
                            <i class="fas fa-user-check" style="color: var(--success-color); margin-right: 0.5rem;"></i>
                            ${att.studentName || 'Estudiante sin nombre'}
                        </h4>
                    </div>
                    <span style="background: rgba(16, 185, 129, 0.1); color: var(--success-color); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">Presente</span>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.875rem;">
                    ${att.studentId ? `
                        <div style="color: var(--text-secondary);">
                            <i class="fas fa-id-card" style="color: var(--primary-color); margin-right: 0.5rem;"></i>
                            <strong>ID:</strong> ${att.studentId}
                        </div>
                    ` : ''}
                    
                    <div style="color: var(--text-secondary);">
                        <i class="fas fa-clock" style="color: var(--primary-color); margin-right: 0.5rem;"></i>
                        <strong>Hora:</strong> ${time}
                    </div>
                    
                    ${att.studentEmail ? `
                        <div style="color: var(--text-secondary); grid-column: 1/-1;">
                            <i class="fas fa-envelope" style="color: var(--primary-color); margin-right: 0.5rem;"></i>
                            <strong>Email:</strong> ${att.studentEmail}
                        </div>
                    ` : ''}
                </div>
                
                <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color); color: var(--text-secondary); font-size: 0.875rem;">
                    <i class="fas fa-book" style="color: var(--secondary-color); margin-right: 0.5rem;"></i>
                    <strong>Curso:</strong> ${courseData.courseName}
                </div>
            `;
            
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-2px)';
                card.style.boxShadow = 'var(--shadow-lg)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = 'none';
            });
            
            container.appendChild(card);
        });
    });
}

// Establecer listener para cambios en asistencia en tiempo real
function watchAttendanceUpdates() {
    if (!currentUser) return;
    
    // Escuchar cambios en sesiones en tiempo real
    const sessionsRef = database.ref('sessions');
    sessionsRef.on('value', () => {
        // Recargar asistencia cuando hay cambios
        filterAttendanceByDate();
    });
}

// Manejar agregar estudiante
async function handleAddStudent(e) {
    e.preventDefault();
    
    const name = document.getElementById('studentName').value;
    const studentId = document.getElementById('studentId').value;
    const email = document.getElementById('studentEmail').value;
    const phone = document.getElementById('studentPhone').value;
    
    try {
        // Directly add or update the student in Firebase Realtime Database (source of truth)
        if (!currentUser || !currentUser.uid) throw new Error('Usuario no autenticado');
        const studentsRef = database.ref('teachers/' + currentUser.uid + '/students');

        if (editingStudentKey) {
            // Update existing
            await studentsRef.child(editingStudentKey).update({
                name: name,
                studentId: studentId,
                email: email,
                phone: phone,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            editingStudentKey = null;
        } else {
            // Create new
            const newStudentRef = studentsRef.push();
            await newStudentRef.set({
                name: name,
                studentId: studentId,
                email: email,
                phone: phone,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
        }
        
        closeModal('addStudentModal');
        document.getElementById('addStudentForm').reset();
        loadStudents();
        showNotification('Estudiante agregado exitosamente', 'success');
    } catch (error) {
        showNotification('Error al agregar estudiante: ' + error.message, 'error');
    }
}

// Manejar agregar curso
async function handleAddCourse(e) {
    e.preventDefault();
    
    const name = document.getElementById('courseName').value;
    const code = document.getElementById('courseCode').value;
    const description = document.getElementById('courseDescription').value;
    const schedule = document.getElementById('courseSchedule').value;
    const instructor = document.getElementById('courseInstructor')?.value || '';
    const room = document.getElementById('courseRoom')?.value || '';
    
    try {
        if (editingCourseId) {
            // Actualizar curso existente
            console.log('📝 Actualizando curso:', editingCourseId);
            await apiFetch(`/api/courses/${editingCourseId}`, { 
                method: 'PUT', 
                body: JSON.stringify({ name, code, description, schedule, instructor, room }) 
            });
            showNotification('Unidad didáctica actualizada exitosamente', 'success');
        } else {
            // Crear nuevo curso
            console.log('✨ Creando nuevo curso');
            await apiFetch('/api/courses', { 
                method: 'POST', 
                body: JSON.stringify({ name, code, description, schedule, instructor, room }) 
            });
            showNotification('Unidad didáctica creada exitosamente', 'success');
        }
        
        closeModal('addCourseModal');
        document.getElementById('addCourseForm').reset();
        editingCourseId = null;
        loadCourses();
    } catch (error) {
        console.error('Error al guardar curso:', error);
        showNotification('Error al guardar unidad didáctica: ' + error.message, 'error');
    }
}

// Renderizar estudiantes
function renderStudents() {
    const container = document.getElementById('studentsGrid');
    container.innerHTML = '';
    
    students.forEach(student => {
        const studentCard = document.createElement('div');
        studentCard.className = 'student-card';
        studentCard.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${student.name}</h3>
                <div class="card-actions">
                    <button class="action-btn" onclick="editStudent('${student.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn" onclick="deleteStudent('${student.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="card-content">
                <div class="card-item">
                    <i class="fas fa-id-card"></i>
                    <span>ID: ${student.studentId}</span>
                </div>
                <div class="card-item">
                    <i class="fas fa-envelope"></i>
                    <span>${student.email || 'No especificado'}</span>
                </div>
                <div class="card-item">
                    <i class="fas fa-phone"></i>
                    <span>${student.phone || 'No especificado'}</span>
                </div>
            </div>
        `;
        container.appendChild(studentCard);
    });
}

// Renderizar cursos
function renderCourses() {
    const container = document.getElementById('coursesGrid');
    container.innerHTML = '';
    
    courses.forEach(course => {
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card';
        
        // Determinar el ícono según el tipo de curso
        let courseIcon = 'fas fa-book';
        if (course.name.includes('Algoritmos')) courseIcon = 'fas fa-project-diagram';
        else if (course.name.includes('Bases de Datos')) courseIcon = 'fas fa-database';
        else if (course.name.includes('Desarrollo')) courseIcon = 'fas fa-code';
        
        courseCard.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${course.name}</h3>
                <div class="card-actions">
                    <button class="action-btn" onclick="editCourse('${course.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn" onclick="deleteCourse('${course.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="card-content">
                <div class="card-item">
                    <i class="fas fa-barcode"></i>
                    <span>Código: ${course.code || 'Sin código'}</span>
                </div>
                <div class="card-item">
                    <i class="${courseIcon}"></i>
                    <span>${course.description || 'Sin descripción'}</span>
                </div>
                <div class="card-item">
                    <i class="fas fa-user"></i>
                    <span>Instructor: ${course.instructor || 'No especificado'}</span>
                </div>
                <div class="card-item">
                    <i class="fas fa-clock"></i>
                    <span>${course.schedule || 'Sin horario'}</span>
                </div>
                <div class="card-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>Aula: ${course.room || 'No especificada'}</span>
                </div>
                <div class="card-item">
                    <i class="fas fa-users"></i>
                    <span>Estudiantes inscritos: ${students.length}</span>
                </div>
            </div>
        `;
        container.appendChild(courseCard);
    });
}

// Actualizar select de cursos
function updateCourseSelect() {
    let select = document.getElementById('courseSelect');

    // Si no existe el select, intentar crearlo dentro del contenedor de controles de asistencia
    if (!select) {
        const controls = document.querySelector('.attendance-controls');
        if (controls) {
            select = document.createElement('select');
            select.id = 'courseSelect';
            select.className = 'select-input';
            controls.insertBefore(select, controls.firstChild);
        } else {
            // No hay lugar donde insertar el select: salir sin hacer nada
            return;
        }
    }

    select.innerHTML = '<option value="">Seleccionar Unidad Didáctica</option>';

    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = course.name;
        select.appendChild(option);
    });
}

// Renderizar calendario de asistencia
function renderAttendanceCalendar() {
    const container = document.getElementById('attendanceCalendar');
    const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const weekDays = ['D','L','M','M','J','V','S'];
    let html = `<div class="calendar-header">
        <h3>${currentYear}</h3>
        <div class="calendar-nav">
            <button onclick="changeYear(-1)"><i class=\"fas fa-chevron-left\"></i></button>
            <button onclick="changeYear(1)"><i class=\"fas fa-chevron-right\"></i></button>
        </div>
    </div>`;
    html += '<div class="year-grid">';
    for (let m = 0; m < 12; m++) {
        const firstDay = new Date(currentYear, m, 1);
        const lastDay = new Date(currentYear, m + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();
        const mm = String(m + 1).padStart(2,'0');
        // compute month stats from attendanceRecords if available (public view)
        let presentCount = 0; let totalMarked = 0;
        attendanceRecords.forEach(rec => {
            const dateStr = rec.date || (rec.timestamp ? new Date(rec.timestamp).toISOString().split('T')[0] : null);
            if (!dateStr) return;
            if (dateStr.startsWith(`${currentYear}-${mm}-`)) {
                totalMarked++;
                if (rec.present || rec.status === 'present') presentCount++;
            }
        });
        const monthPct = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;
        html += '<div class="mini-calendar">';
        html += `<div class="mini-cal-header"><span>${monthNames[m]}</span><span class="mini-cal-stat">${monthPct}%</span></div>`;
        html += '<div class="calendar-grid">';
        weekDays.forEach(d => { html += `<div class="weekday">${d}</div>`; });
        for (let i = 0; i < startingDay; i++) { html += '<div></div>'; }
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${mm}-${String(day).padStart(2,'0')}`;
            const rec = attendanceRecords.find(r => (r.date || (r.timestamp ? new Date(r.timestamp).toISOString().split('T')[0] : '')) === dateStr);
            let dayClass = 'calendar-day';
            if (rec) dayClass += (rec.present || rec.status === 'present') ? ' present' : ' absent';
            html += `<div class="${dayClass}" title="${rec ? (rec.course || '') : ''}">${day}</div>`;
        }
        html += '</div></div>';
    }
    html += '</div>';
    container.innerHTML = html;
}

// Obtener asistencia para una fecha específica
function getAttendanceForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    return attendanceRecords.find(record => record.date === dateStr);
}

// Actualizar estadísticas
function updateStats() {
    const totalStudentsEl = document.getElementById('totalStudents');
    if (totalStudentsEl) totalStudentsEl.textContent = students.length;

    const totalCoursesEl = document.getElementById('totalCourses');
    if (totalCoursesEl) totalCoursesEl.textContent = courses.length;

    // Calcular asistencia de hoy
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendanceRecords.find(record => record.date === today);
    const todayPercentage = todayAttendance ? Math.round((todayAttendance.presentCount / (students.length || 1)) * 100) : 0;
    const todayAttendanceEl = document.getElementById('todayAttendance');
    if (todayAttendanceEl) todayAttendanceEl.textContent = todayPercentage + '%';

    // Calcular promedio general
    const totalRecords = attendanceRecords.length;
    const avgAttendanceEl = document.getElementById('avgAttendance');
    if (totalRecords > 0) {
        const totalPresent = attendanceRecords.reduce((sum, record) => sum + (record.presentCount || 0), 0);
        const totalPossible = totalRecords * (students.length || 1);
        const avgPercentage = Math.round((totalPresent / totalPossible) * 100);
        if (avgAttendanceEl) avgAttendanceEl.textContent = avgPercentage + '%';
    } else {
        if (avgAttendanceEl) avgAttendanceEl.textContent = '0%';
    }
}

// Mostrar sección específica
function showSection(sectionName) {
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Ocultar todos los elementos de navegación
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Mostrar la sección seleccionada
    document.getElementById(sectionName + 'Section').classList.add('active');
    
    // Activar el elemento de navegación correspondiente si el event está disponible
    try {
        if (typeof event !== 'undefined' && event && event.target && event.target.classList) {
            event.target.classList.add('active');
        }
    } catch (e) {
        // no-op
    }
    
    // Actualizar título de la página
    const titles = {
        'overview': 'Resumen',
        'students': 'Gestión de Alumnos',
        'attendance': 'Control de Asistencia',
        'courses': 'Unidades Didácticas',
        'reports': 'Reportes y Estadísticas'
    };
    
    const pageTitleEl = document.getElementById('pageTitle');
    if (pageTitleEl) pageTitleEl.textContent = titles[sectionName];
    const pageSubtitleEl = document.getElementById('pageSubtitle');
    if (pageSubtitleEl) pageSubtitleEl.textContent = getSectionSubtitle(sectionName);
}

// Obtener subtítulo de la sección
function getSectionSubtitle(sectionName) {
    const subtitles = {
        'overview': 'Bienvenido al panel de control',
        'students': 'Administra la información de tus estudiantes',
        'attendance': 'Registra y consulta la asistencia de tus alumnos',
        'courses': 'Gestiona tus unidades didácticas',
        'reports': 'Analiza el rendimiento y genera reportes'
    };
    return subtitles[sectionName];
}

// Mostrar/ocultar páginas
function showLogin() {
    hideAllPages();
    document.getElementById('loginPage').classList.add('active');
}

function showRegister() {
    hideAllPages();
    document.getElementById('registerPage').classList.add('active');
}

function showDashboard() {
    hideAllPages();
    document.getElementById('dashboardPage').classList.add('active');
}

function hideAllPages() {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
}

// Mostrar modales
function showAddStudentModal() {
    document.getElementById('addStudentModal').classList.add('active');
}

function showAddCourseModal() {
    console.log('⊕ Abriendo modal para crear nuevo curso');
    
    // Resetear estado de edición
    editingCourseId = null;
    document.getElementById('addCourseForm').reset();
    
    // Restaurar título y botón del modal
    document.querySelector('#addCourseModal .modal-header h3').textContent = 'Nueva Unidad Didáctica';
    document.querySelector('#addCourseForm button[type="submit"]').textContent = 'Crear';
    
    // Abrir modal
    document.getElementById('addCourseModal').classList.add('active');
}

function showAddModal() {
    const currentSection = document.querySelector('.section.active');
    if (currentSection.id === 'studentsSection') {
        showAddStudentModal();
    } else if (currentSection.id === 'coursesSection') {
        showAddCourseModal();
    }
}

// Cerrar modales
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    // If closing student modal, reset edit state and UI
    if (modalId === 'addStudentModal') {
        editingStudentKey = null;
        const header = document.querySelector('#addStudentModal .modal-header h3');
        if (header) header.textContent = 'Agregar Alumno';
        const submitBtn = document.querySelector('#addStudentForm button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Agregar';
        // reset form fields
        const form = document.getElementById('addStudentForm');
        if (form) form.reset();
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

// Funciones de utilidad
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-password i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.classList.remove('fa-eye');
        toggleBtn.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleBtn.classList.remove('fa-eye-slash');
        toggleBtn.classList.add('fa-eye');
    }
}

function toggleRegPassword() {
    const passwordInput = document.getElementById('regPassword');
    const toggleBtn = document.querySelector('#registerPage .toggle-password i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.classList.remove('fa-eye');
        toggleBtn.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleBtn.classList.remove('fa-eye-slash');
        toggleBtn.classList.add('fa-eye');
    }
}

function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    const dt = document.getElementById('dateTime');
    if (dt) dt.textContent = now.toLocaleDateString('es-ES', options);
}

function getMonthName(month) {
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month];
}

// Funciones de gestión de estudiantes
function editStudent(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return showNotification('Estudiante no encontrado', 'error');

    // Set edit mode
    editingStudentKey = studentId;
    // Fill form
    document.getElementById('studentName').value = student.name || '';
    document.getElementById('studentId').value = student.studentId || '';
    document.getElementById('studentEmail').value = student.email || '';
    document.getElementById('studentPhone').value = student.phone || '';

    // Update modal title and submit button text if present
    const header = document.querySelector('#addStudentModal .modal-header h3');
    if (header) header.textContent = 'Editar Alumno';
    const submitBtn = document.querySelector('#addStudentForm button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Guardar cambios';

    showAddStudentModal();
}

async function deleteStudent(studentId) {
    if (confirm('¿Estás seguro de que quieres eliminar este estudiante?')) {
        try {
            // Prefer deleting directly from Firebase Realtime Database (real data)
            const studentsRef = database.ref('teachers/' + currentUser.uid + '/students');

            // Try direct removal by key (this works when `studentId` argument is the Firebase push key)
            try {
                await studentsRef.child(studentId).remove();
            } catch (e) {
                console.warn('Direct key removal failed, will try lookup by studentId field', e);
            }

            // Also attempt to remove any record whose `studentId` field matches the student's studentId value
            const localStudent = students.find(s => s.id === studentId || s.studentId === studentId);
            if (localStudent && localStudent.studentId) {
                const snap = await studentsRef.orderByChild('studentId').equalTo(localStudent.studentId).once('value');
                if (snap.exists()) {
                    const val = snap.val();
                    for (const key in val) {
                        await studentsRef.child(key).remove();
                    }
                }
            }
            loadStudents();
            showNotification('Estudiante eliminado exitosamente', 'success');
        } catch (error) {
            showNotification('Error al eliminar estudiante: ' + error.message, 'error');
        }
    }
}

// Funciones de gestión de cursos
function editCourse(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (course) {
        console.log('✏️ Editando curso:', course);
        
        // Guardar ID para saber que estamos editando
        editingCourseId = courseId;
        
        // Llenar el formulario con los datos del curso
        document.getElementById('courseName').value = course.name || '';
        document.getElementById('courseCode').value = course.code || '';
        document.getElementById('courseDescription').value = course.description || '';
        document.getElementById('courseSchedule').value = course.schedule || '';
        document.getElementById('courseInstructor').value = course.instructor || '';
        document.getElementById('courseRoom').value = course.room || '';
        
        // Actualizar el título y botón del modal
        document.querySelector('#addCourseModal .modal-header h3').textContent = 'Editar Unidad Didáctica';
        document.querySelector('#addCourseForm button[type="submit"]').textContent = 'Actualizar';
        
        // Abrir el modal
        document.getElementById('addCourseModal').classList.add('active');
    }
}

async function deleteCourse(courseId) {
    const course = courses.find(c => c.id === courseId);
    const courseName = course ? course.name : 'la unidad';
    
    if (confirm(`¿Estás seguro de que quieres eliminar "${courseName}"?`)) {
        try {
            console.log('🗑️ Eliminando curso:', courseId);
            
            // Eliminar a través de la API
            await apiFetch(`/api/courses/${courseId}`, { method: 'DELETE' });
            
            // Si estábamos editando este curso, limpiar el estado
            if (editingCourseId === courseId) {
                editingCourseId = null;
                closeModal('addCourseModal');
            }
            
            loadCourses();
            showNotification('Unidad didáctica eliminada exitosamente', 'success');
        } catch (error) {
            console.error('Error al eliminar curso:', error);
            showNotification('Error al eliminar unidad didáctica: ' + error.message, 'error');
        }
    }
}

// Funciones de asistencia
function markAttendance() {
    const selectEl = document.getElementById('courseSelect');
    const courseId = selectEl ? selectEl.value : '';
    if (!courseId) {
        showNotification('Por favor selecciona una unidad didáctica', 'warning');
        return;
    }
    
    // Implementar marcado de asistencia
    showNotification('Función de marcado de asistencia en desarrollo', 'info');
}

// Abrir la cámara y preparar escaneo QR
function openCameraForAttendance() {
    const overlay = document.getElementById('cameraOverlay');
    overlay.style.display = 'block';

    // Si ya está activo, no reabrir
    if (cameraStream) return;

    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const ctx = canvas.getContext('2d');

    // Pedir permiso y abrir la cámara trasera si es posible
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        .then(stream => {
            cameraStream = stream;
            video.srcObject = stream;
            video.play();

            qrScannerEnabled = true;

            scanInterval = setInterval(() => {
                if (!qrScannerEnabled) return;
                if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                try {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    // Usamos jsQR (asegúrate de incluir la librería en index.html)
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    if (code) {
                        handleScannedPayload(code.data);
                    }
                } catch (err) {
                    console.error('Error leyendo imagen:', err);
                }
            }, 500);
        })
        .catch(err => {
            console.error('No se pudo acceder a la cámara:', err);
            showNotification('No se pudo acceder a la cámara: ' + err.message, 'error');
        });
}

function stopCamera() {
    qrScannerEnabled = false;
    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }
    if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        cameraStream = null;
    }
    const overlay = document.getElementById('cameraOverlay');
    if (overlay) overlay.style.display = 'none';
}

// Manejar payload escaneado
async function handleScannedPayload(payload) {
    // Evitar procesar múltiples veces el mismo código
    if (!qrScannerEnabled) return;
    qrScannerEnabled = false; // bloquear temporalmente

    const scanResultEl = document.getElementById('scanResult');
    if (scanResultEl) scanResultEl.textContent = 'Código detectado: ' + payload;

    // Intentar parsear JSON
    let data = null;
    try { data = JSON.parse(payload); } catch (e) { data = null; }

    if (data && data.type === 'student' && data.dni) {
        // If the QR was created by a teacher it may include teacherId and courseId
        const payloadCourseId = data.courseId || null;
        const dateStr = new Date().toISOString().split('T')[0];

        // Prefer teacherId from payload, otherwise use currently logged-in teacher, otherwise 'public'
        const teacherId = data.teacherId || (currentUser ? currentUser.uid : 'public');

        // Ensure the student exists under the teacher's students node and enroll in course if provided
        try {
            const studentsRef = database.ref('teachers/' + teacherId + '/students');
            let studentKey = null;
            // try to find by studentId (dni)
            const snap = await studentsRef.orderByChild('studentId').equalTo(data.dni).once('value');
            if (snap.exists()) {
                const val = snap.val();
                studentKey = Object.keys(val)[0];
                await studentsRef.child(studentKey).update({ name: data.name, studentId: data.dni, updatedAt: firebase.database.ServerValue.TIMESTAMP });
            } else {
                const newRef = studentsRef.push();
                await newRef.set({ name: data.name, studentId: data.dni, createdAt: firebase.database.ServerValue.TIMESTAMP });
                studentKey = newRef.key;
            }

            // If payload includes a courseId, enroll the student in that course under the teacher
            if (payloadCourseId) {
                const courseStudentsRef = database.ref('teachers/' + teacherId + '/courses/' + payloadCourseId + '/students');
                await courseStudentsRef.child(studentKey).set({ studentId: data.dni, name: data.name });
            }
        } catch (ensErr) {
            console.warn('Error ensuring student/enrollment in teacher node:', ensErr);
        }

        try {
            // register attendance
            const selectEl = document.getElementById('courseSelect');
            const selectedCourse = selectEl ? selectEl.value : '';
            const courseId = payloadCourseId || selectedCourse || 'general';
            try {
                await apiFetch('/api/attendance', { method: 'POST', body: JSON.stringify({ courseId, studentDni: data.dni, studentName: data.name, timestamp: Date.now(), date: dateStr }) });
            } catch (_) {
                const attendanceRef = database.ref('teachers/' + teacherId + '/attendance').push();
                await attendanceRef.set({
                    studentName: data.name,
                    studentDni: data.dni,
                    courseId: courseId,
                    date: dateStr,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
            }

            showNotification('Asistencia registrada para ' + data.name, 'success');
            if (scanResultEl) scanResultEl.textContent = 'Asistencia registrada para ' + data.name;
        } catch (attErr) {
            showNotification('Error registrando asistencia: ' + (attErr.message || attErr), 'error');
        }
    } else {
        showNotification('QR no reconocido', 'warning');
        if (scanResultEl) scanResultEl.textContent = 'QR no reconocido: ' + payload;
    }

    // Después de 2 segundos, permitir nuevos escaneos
    setTimeout(() => { qrScannerEnabled = true; }, 2000);
}

function showAttendanceDetails(date) {
    // Implementar detalles de asistencia
    showNotification('Función de detalles de asistencia en desarrollo', 'info');
}

function changeYear(direction) { currentYear += direction; renderAttendanceCalendar(); }

// Funciones de reportes
function generateReport() {
    // Implementar generación de reportes
    showNotification('Función de generación de reportes en desarrollo', 'info');
}

// Cerrar sesión
function logout() {
    auth.signOut().then(() => {
        currentUser = null;
        students = [];
        courses = [];
        attendanceRecords = [];
        showLogin();
        showNotification('Sesión cerrada exitosamente', 'success');
    }).catch((error) => {
        showNotification('Error al cerrar sesión: ' + error.message, 'error');
    });
}

// Mostrar notificaciones
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    `;
    
    // Configurar colores según el tipo
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    
    // Agregar al DOM
    document.body.appendChild(notification);
    
    // Remover después de 5 segundos
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Agregar estilos para notificaciones
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(notificationStyles);

document.addEventListener('DOMContentLoaded', () => {
    // Ejecutar cargas sólo si estamos en el dashboard (evitar ejecutar en páginas públicas como /scan)
    if (document.getElementById('dashboardPage')) {
        loadUserData();
        loadCourses();
    }
});

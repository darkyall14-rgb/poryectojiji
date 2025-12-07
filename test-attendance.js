/**
 * Script para probar que la asistencia se guarda correctamente
 * Ejecutar: node test-attendance.js
 */

const http = require('http');

// Datos de prueba
const testData = {
    studentId: "TEST-12345",
    studentName: "Juan Perez Prueba",
    studentEmail: "juan@test.com",
    studentPhone: "+57 300 123 4567"
};

// Primero crear una sesión para obtener un sessionId válido
function createSession() {
    return new Promise((resolve, reject) => {
        const sessionData = JSON.stringify({
            courseId: 'TEST-001',
            courseName: 'Matemáticas',
            teacherId: 'PROF-TEST',
            teacherName: 'Prof. Test'
        });

        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/sessions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': sessionData.length
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                console.log('✅ Sesión creada:', JSON.parse(body));
                resolve(JSON.parse(body).sessionId);
            });
        });

        req.on('error', reject);
        req.write(sessionData);
        req.end();
    });
}

// Registrar asistencia
function registerAttendance(sessionId) {
    return new Promise((resolve, reject) => {
        const attendanceData = JSON.stringify(testData);

        const options = {
            hostname: 'localhost',
            port: 5000,
            path: `/api/sessions/${sessionId}/attendance`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': attendanceData.length
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                console.log('Respuesta del servidor:', res.statusCode);
                console.log('Datos:', JSON.parse(body));
                resolve();
            });
        });

        req.on('error', reject);
        req.write(attendanceData);
        req.end();
    });
}

// Obtener asistencia de la sesión
function getAttendance(sessionId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: `/api/sessions/${sessionId}/attendance`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                const attendanceData = JSON.parse(body);
                console.log('\n✅ Asistencia guardada en Firebase:');
                console.log(JSON.stringify(attendanceData, null, 2));
                resolve(attendanceData);
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Ejecutar pruebas
async function runTests() {
    console.log('🔄 Iniciando pruebas de asistencia...\n');
    
    try {
        console.log('1. Creando sesión...');
        const sessionId = await createSession();
        
        console.log('\n2. Registrando asistencia...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar a que se guarde
        await registerAttendance(sessionId);
        
        console.log('\n3. Verificando asistencia guardada...');
        await new Promise(resolve => setTimeout(resolve, 1500)); // Esperar a que se propague
        await getAttendance(sessionId);
        
        console.log('\n✅ Prueba completada');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en prueba:', error);
        process.exit(1);
    }
}

runTests();

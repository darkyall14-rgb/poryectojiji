require('dotenv').config();
const express = require("express");
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
const app = express();
const PORT = process.env.PORT || 5000;

// Body parsing
app.use(express.json());
app.use(cors());

// Simple request logger to help debug 404s
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.originalUrl);
  next();
});

// Static files
app.use(express.static(path.join(__dirname, "src", "public")));

// --- Inicialización de Firebase Admin (obligatorio) ---
// Prefer env vars, but allow local file `serviceAccountKey.json` for development convenience
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  const localKeyPath = path.join(__dirname, 'serviceAccountKey.json');
  try {
    if (require('fs').existsSync(localKeyPath)) {
      // Leer archivo local y establecer la variable de entorno temporalmente
      const raw = require('fs').readFileSync(localKeyPath, 'utf8');
      process.env.FIREBASE_SERVICE_ACCOUNT = raw;
      console.log('Usando credenciales desde serviceAccountKey.json');
    }
  } catch (e) {
    // noop
  }
}

if (!process.env.FIREBASE_SERVICE_ACCOUNT || !process.env.FIREBASE_DATABASE_URL) {
  console.error('ERROR: Debes establecer las variables de entorno FIREBASE_SERVICE_ACCOUNT y FIREBASE_DATABASE_URL con las credenciales de Firebase.');
  console.error('Ejemplo en Render: agrega FIREBASE_SERVICE_ACCOUNT (JSON) y FIREBASE_DATABASE_URL. No subas credenciales al repositorio.');
  process.exit(1);
}

try {
  let serviceAccount = null;
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (e) {
    // Puede venir codificado en base64 (útil para algunos paneles que no preservan saltos de línea)
    try {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
      serviceAccount = JSON.parse(decoded);
    } catch (err2) {
      throw new Error('No se pudo parsear FIREBASE_SERVICE_ACCOUNT como JSON ni como base64');
    }
  }
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
  console.log('Firebase Admin inicializado correctamente.');
} catch (err) {
  console.error('Error al inicializar Firebase Admin:', err.message);
  process.exit(1);
}

// Verificar conexión a Realtime Database
async function verificarConexionFirebase() {
  try {
    // Hacemos una lectura simple para garantizar permisos
    await admin.database().ref('/').limitToFirst(1).once('value');
    console.log('Conexión a Firebase Realtime Database verificada.');
  } catch (err) {
    console.error('No fue posible conectar a Firebase Realtime Database:', err.message);
    process.exit(1);
  }
}

// SSE clients para actualizaciones en tiempo real
const sseClients = new Set();
function enviarEventoSSE(nombre, dato) {
  const payload = `event: ${nombre}\ndata: ${JSON.stringify(dato)}\n\n`;
  for (const res of sseClients) {
    try { res.write(payload); } catch (e) { /* ignorar errores de envío */ }
  }
}

// Middleware: verificar token de Firebase (opcional)
async function verifyFirebaseTokenOptional(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return next();
  const idToken = auth.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded;
  } catch (err) {
    console.warn('Token inválido:', err.message);
    // No bloqueamos si es opcional; simplemente no seteamos req.user
  }
  return next();
}

// Middleware: requerir token válido (para rutas protegidas)
async function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' });
  const idToken = auth.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// Middleware: requerir rol específico en custom claims (ej. 'teacher' o 'admin')
function requireRole(role) {
  return async (req, res, next) => {
    // asegúrate de que el token ya fue verificado por requireAuth
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    // Verificar claims comunes: decoded token puede tener `role` o claim booleano
    const decoded = req.user;
    if (decoded.role && decoded.role === role) return next();
    if (decoded[role] === true) return next();
    // fallback: si es admin explícito
    if (decoded.admin === true) return next();
    return res.status(403).json({ error: 'Prohibido: se requiere rol ' + role });
  };
}

// Endpoint opcional para verificar reCAPTCHA (requiere env RECAPTCHA_SECRET)
const fetch = require('node-fetch');
app.post('/api/verify-recaptcha', express.json(), async (req, res) => {
  const token = req.body && req.body.token;
  if (!token) return res.status(400).json({ ok: false, error: 'No token' });
  if (!process.env.RECAPTCHA_SECRET) return res.status(500).json({ ok: false, error: 'reCAPTCHA no configurado en el servidor' });
  try {
    const secret = process.env.RECAPTCHA_SECRET;
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`;
    const r = await fetch(verifyUrl, { method: 'POST' });
    const j = await r.json();
    return res.json({ ok: j.success, score: j.score, action: j.action, details: j });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Helpers para estudiantes usando Firebase RTDB
async function obtenerEstudiantes() {
  const snap = await admin.database().ref('students').once('value');
  const val = snap.val() || {};
  return Object.keys(val).map(k => ({ id: k, ...val[k] }));
}

async function crearEstudiante(estudiante) {
  const ref = admin.database().ref('students').push();
  await ref.set(estudiante);
  const id = ref.key;
  const creado = { id, ...estudiante };
  enviarEventoSSE('students-updated', await obtenerEstudiantes());
  return creado;
}

async function agregarAsistencia(studentId, registro) {
  const ref = admin.database().ref(`students/${studentId}/attendance`);
  const snap = await ref.once('value');
  const actual = snap.val() || [];
  actual.push(registro);
  await ref.set(actual);
  // Obtener estudiante actualizado
  const studentSnap = await admin.database().ref(`students/${studentId}`).once('value');
  const studentData = studentSnap.val() || null;
  const student = studentData ? { id: studentId, ...studentData } : null;
  enviarEventoSSE('students-updated', await obtenerEstudiantes());
  return { student, registro };
}

// --- API endpoints ---

app.get('/api/health', async (req, res) => {
  try {
    await verificarConexionFirebase();
    res.json({ ok: true, env: 'firebase' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// SSE endpoint for real-time updates
app.get('/api/events', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.write('\n');
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

// Get students
app.get('/api/students', async (req, res, next) => {
  try {
    const data = await obtenerEstudiantes();
    res.json(data);
  } catch (err) { next(err); }
});

// Create student
app.post('/api/students', async (req, res, next) => {
  try {
    // Registro público permitido: validar campos mínimos
    const { ciclo, curso, nombres, apellidos } = req.body;
    if (!ciclo || !curso || !nombres || !apellidos) return res.status(400).json({ error: 'Faltan campos' });
    if (nombres.length < 2 || apellidos.length < 2) return res.status(400).json({ error: 'Nombres/apellidos demasiado cortos' });
    const estudiante = { cycle: ciclo, course: curso, names: nombres, lastnames: apellidos, registeredAt: new Date().toISOString(), attendance: [], avatar: null };
    const creado = await crearEstudiante(estudiante);
    res.status(201).json(creado);
  } catch (err) { next(err); }
});

// Mark attendance
app.post('/api/attendance', async (req, res, next) => {
  try {
    // If Authorization Bearer token is present, verify optionally
    await verifyFirebaseTokenOptional(req, res, async () => {
      const { studentId, status, markedBy } = req.body;
      if (!studentId || !status) return res.status(400).json({ error: 'Faltan campos' });
      const author = req.user ? (req.user.name || req.user.email || req.user.uid) : (markedBy || 'Docente');
      const registro = { date: new Date().toISOString(), status, markedBy: author };
      const result = await agregarAsistencia(studentId, registro);
      if (!result || !result.student) return res.status(500).json({ ok: false, error: 'No se encontró estudiante tras registrar asistencia' });
      // Incluir autor en la respuesta
      res.json({ ok: true, student: result.student, registro: result.registro, markedBy: author });
    });
  } catch (err) { next(err); }
});

// Editar estudiante (protegido, requiere rol 'teacher' o 'admin')
app.put('/api/students/:id', requireAuth, requireRole('teacher'), async (req, res, next) => {
  try {
    const id = req.params.id;
    const updates = req.body || {};
    await admin.database().ref(`students/${id}`).update(updates);
    enviarEventoSSE('students-updated', await obtenerEstudiantes());
    const snap = await admin.database().ref(`students/${id}`).once('value');
    res.json({ ok: true, student: { id, ...snap.val() } });
  } catch (err) { next(err); }
});

// Eliminar estudiante (protegido, requiere rol 'teacher' o 'admin')
app.delete('/api/students/:id', requireAuth, requireRole('teacher'), async (req, res, next) => {
  try {
    const id = req.params.id;
    await admin.database().ref(`students/${id}`).remove();
    enviarEventoSSE('students-updated', await obtenerEstudiantes());
    res.json({ ok: true });
  } catch (err) { next(err); }
});




// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`ERROR [${new Date().toISOString()}]:`, err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// Servir frontend principal en la raíz (fallback)
app.get('/', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'src', 'views', 'index.html'));
  } catch (err) {
    res.status(500).json({ error: 'No se pudo enviar index.html', message: err.message });
  }
});

// Verificamos conexión a Firebase antes de arrancar el servidor
verificarConexionFirebase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en:`);
    console.log(`- Local: http://localhost:${PORT}`);
    console.log(`- Red local: http://192.168.137.220:${PORT}`);
  });
}).catch(err => {
  console.error('No fue posible verificar Firebase, se detendrá el servidor:', err.message || err);
  process.exit(1);
});

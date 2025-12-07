const admin = require('firebase-admin');
const path = require('path');

// Obtener configuración de Firebase desde variables de entorno
let serviceAccount;

// Intentar cargar desde variable de entorno (JSON string) o desde archivo
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  // Para producción (Render): JSON como string en variable de entorno
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (error) {
    console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:', error.message);
    process.exit(1);
  }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  // Para desarrollo local: ruta al archivo
  const serviceAccountPath = path.join(__dirname, '../../', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
  try {
    serviceAccount = require(serviceAccountPath);
  } catch (error) {
    console.error('❌ Error loading service account from path:', error.message);
    process.exit(1);
  }
} else {
  // Fallback: intentar cargar desde ubicación por defecto
  const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
  try {
    serviceAccount = require(serviceAccountPath);
  } catch (error) {
    console.error('❌ Error loading service account. Please configure FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH');
    process.exit(1);
  }
}

const databaseURL = process.env.FIREBASE_DATABASE_URL || "https://xanes-36606-default-rtdb.firebaseio.com";

// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: databaseURL
    });
    
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    process.exit(1);
  }
}

// Obtener instancia de la base de datos
const db = admin.database();

// Funciones utilitarias para trabajar con Firebase
const firebaseUtils = {
  
  // Leer datos una sola vez
  async readOnce(path) {
    try {
      const snapshot = await db.ref(path).once('value');
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error(`Error reading ${path}:`, error);
      throw error;
    }
  },

  // Escribir datos
  async write(path, data) {
    try {
      await db.ref(path).set(data);
      return data;
    } catch (error) {
      console.error(`Error writing to ${path}:`, error);
      throw error;
    }
  },

  // Actualizar datos (merge)
  async update(path, data) {
    try {
      await db.ref(path).update(data);
      return data;
    } catch (error) {
      console.error(`Error updating ${path}:`, error);
      throw error;
    }
  },

  // Eliminar datos
  async delete(path) {
    try {
      await db.ref(path).remove();
      return true;
    } catch (error) {
      console.error(`Error deleting ${path}:`, error);
      throw error;
    }
  },

  // Push (agregar con clave generada automáticamente)
  async push(path, data) {
    try {
      const ref = db.ref(path).push();
      await ref.set(data);
      return { id: ref.key, ...data };
    } catch (error) {
      console.error(`Error pushing to ${path}:`, error);
      throw error;
    }
  },

  // Escuchar cambios en tiempo real
  onValueChange(path, callback) {
    const ref = db.ref(path);
    ref.on('value', (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    });
    // Retornar función para dejar de escuchar
    return () => ref.off();
  },

  // Escuchar cambios específicos (añadido, modificado, eliminado)
  onChildEvent(path, callbacks) {
    const ref = db.ref(path);
    if (callbacks.added) ref.on('child_added', (snapshot) => callbacks.added(snapshot.key, snapshot.val()));
    if (callbacks.modified) ref.on('child_changed', (snapshot) => callbacks.modified(snapshot.key, snapshot.val()));
    if (callbacks.removed) ref.on('child_removed', (snapshot) => callbacks.removed(snapshot.key));
    return () => ref.off();
  }
};

module.exports = { admin, db, firebaseUtils };

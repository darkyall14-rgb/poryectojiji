// Firebase config and initialization (ES module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBPTiZPuy5wwR5VcmQvECaCI0QP4MF-n6w",
  authDomain: "app-z-9ad8d.firebaseapp.com",
  databaseURL: "https://app-z-9ad8d-default-rtdb.firebaseio.com",
  projectId: "app-z-9ad8d",
  storageBucket: "app-z-9ad8d.firebasestorage.app",
  messagingSenderId: "699960964593",
  appId: "1:699960964593:web:c4dbf134ef44e71f66c050"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };

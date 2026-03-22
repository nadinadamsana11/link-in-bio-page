import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBUesmgJl_yPNbiGtPg9TB2WSxXy-i61ts",
  authDomain: "link-in-bio-page-4d20e.firebaseapp.com",
  projectId: "link-in-bio-page-4d20e",
  storageBucket: "link-in-bio-page-4d20e.firebasestorage.app",
  messagingSenderId: "848089784295",
  appId: "1:848089784295:web:7a434dfba4eb0549e76742",
  measurementId: "G-VVG5Q23CNF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, storage, googleProvider };

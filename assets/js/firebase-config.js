import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDFhkaUqWsL2k-8zOyGjFbSt2t-4zC31ts",
  authDomain: "link-in-bio-page-932ea.firebaseapp.com",
  projectId: "link-in-bio-page-932ea",
  storageBucket: "link-in-bio-page-932ea.firebasestorage.app",
  messagingSenderId: "180365867785",
  appId: "1:180365867785:web:d43ed00e3fcfeb8bc1f1d8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, storage, googleProvider };

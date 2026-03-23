import { auth, db } from '../assets/js/firebase-config.js';
import { doc, getDoc, setDoc, query, collection, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showToast } from '../assets/js/utils.js';

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        loadCurrentData();
    } else {
        window.location.href = '../auth/login.html';
    }
});

async function loadCurrentData() {
    const userDocRef = doc(db, "users", currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) return;

    const data = userDoc.data();
    document.getElementById('editDisplayName').value = data.displayName || "";
    document.getElementById('editUsername').value = data.username || "";
    document.getElementById('editBio').value = data.bio || "";
    document.getElementById('editDob').value = data.dob || "";
    document.getElementById('editGender').value = data.gender || "";
    document.getElementById('editHome').value = data.home || "";
    document.getElementById('editTel').value = data.tel || "";
    
    updateCounter();
}

const bioCounter = document.getElementById('bioCounter');
const bioInput = document.getElementById('editBio');
function updateCounter() {
    bioCounter.textContent = `${bioInput.value.length}/150`;
}
bioInput.addEventListener('input', updateCounter);

async function isUsernameAvailable(username, uid) {
    const q = query(collection(db, "users"), where("username", "==", username.toLowerCase()));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return true;
    return snapshot.docs[0].id === uid;
}

document.getElementById('saveEditBtn').addEventListener('click', async () => {
    const btn = document.getElementById('saveEditBtn');
    const originalContent = btn.innerHTML;
    const username = document.getElementById('editUsername').value.trim().toLowerCase();

    if (!username) return showToast("Handle required", "error");

    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> SAVING...`;
    if (window.lucide) window.lucide.createIcons();

    try {
        if (!(await isUsernameAvailable(username, currentUser.uid))) {
            showToast("Handle is already taken", "error");
            return;
        }

        const updates = {
            displayName: document.getElementById('editDisplayName').value,
            username: username,
            bio: bioInput.value,
            dob: document.getElementById('editDob').value,
            gender: document.getElementById('editGender').value,
            home: document.getElementById('editHome').value,
            tel: document.getElementById('editTel').value
        };

        await setDoc(doc(db, "users", currentUser.uid), updates, { merge: true });
        showToast("Profile Updated!", "success");
        setTimeout(() => window.location.href = 'index.html', 1500);
    } catch (err) {
        console.error(err);
        showToast("Update failed", "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalContent;
        if (window.lucide) window.lucide.createIcons();
    }
});

if (window.lucide) window.lucide.createIcons();

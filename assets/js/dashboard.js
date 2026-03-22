import { auth, db, storage } from '../assets/js/firebase-config.js';
import { 
    doc, 
    getDoc, 
    updateDoc, 
    arrayUnion, 
    arrayRemove 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let currentUser = null;
let userLinks = [];

const avatarPreview = document.getElementById('avatarPreview');
const photoInput = document.getElementById('photoInput');
const displayNameInput = document.getElementById('displayName');
const usernameInput = document.getElementById('dashboardUsername');
const bioInput = document.getElementById('bio');
const linksListEl = document.getElementById('linksList');
const linkModal = document.getElementById('linkModal');
const linkForm = document.getElementById('linkForm');

// Observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        loadUserData();
    }
});

async function loadUserData() {
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (userDoc.exists()) {
        const data = userDoc.data();
        displayNameInput.value = data.displayName || "";
        usernameInput.value = data.username || "";
        bioInput.value = data.bio || "";
        userLinks = data.links || [];
        
        if (data.photoURL) {
            avatarPreview.innerHTML = `<img src="${data.photoURL}" class="w-full h-full object-cover">`;
        }

        document.getElementById('publicProfileBtn').href = `../profile/view.html?u=${data.username}`;
        renderLinks();
    }
}

const setLoading = (btn, isLoading, originalContent) => {
    if (!btn) return;
    if (isLoading) {
        btn.disabled = true;
        btn.classList.add('opacity-70', 'cursor-not-allowed');
        btn.innerHTML = `<span class="flex items-center justify-center gap-2"><i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Saving...</span>`;
        if (window.lucide) window.lucide.createIcons();
    } else {
        btn.disabled = false;
        btn.classList.remove('opacity-70', 'cursor-not-allowed');
        btn.innerHTML = originalContent;
        if (window.lucide) window.lucide.createIcons();
    }
};

// Profile Updates
const saveProfileBtn = document.getElementById('saveProfileBtn');
saveProfileBtn.addEventListener('click', async () => {
    const originalText = saveProfileBtn.innerHTML;
    setLoading(saveProfileBtn, true, originalText);
    try {
        await updateDoc(doc(db, "users", currentUser.uid), {
            displayName: displayNameInput.value,
            bio: bioInput.value
        });
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(saveProfileBtn, false, originalText);
    }
});

// Photo Upload
photoInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const storageRef = ref(storage, `profiles/${currentUser.uid}`);
    try {
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        
        await updateDoc(doc(db, "users", currentUser.uid), { photoURL: url });
        avatarPreview.innerHTML = `<img src="${url}" class="w-full h-full object-cover">`;
    } catch (error) {
        console.error(error);
    }
});

// Link Management
function renderLinks() {
    if (userLinks.length === 0) {
        linksListEl.innerHTML = `<div class="text-center py-12 text-slate-500">No links added yet.</div>`;
        return;
    }

    linksListEl.innerHTML = userLinks.map((link, index) => `
        <div class="glass-dark border border-slate-800 p-4 rounded-xl flex justify-between items-center group">
            <div class="flex items-center gap-4">
                <div class="bg-slate-800 p-3 rounded-lg text-slate-400">
                    <i data-lucide="${link.icon || 'link'}"></i>
                </div>
                <div>
                    <h4 class="font-semibold text-slate-200">${link.title}</h4>
                    <p class="text-xs text-slate-500 truncate max-w-[200px]">${link.url}</p>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="editLink(${index})" class="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all">
                    <i data-lucide="edit-2" class="w-4 h-4"></i>
                </button>
                <button onclick="deleteLink(${index})" class="p-2 hover:bg-red-900/40 rounded-lg text-slate-400 hover:text-red-400 transition-all">
                    <i data-lucide="trash" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

window.deleteLink = async (index) => {
    if (!confirm("Delete this link?")) return;
    const linkToDelete = userLinks[index];
    userLinks.splice(index, 1);
    await updateDoc(doc(db, "users", currentUser.uid), { links: userLinks });
    renderLinks();
};

window.editLink = (index) => {
    const link = userLinks[index];
    document.getElementById('modalTitle').textContent = "Edit Link";
    document.getElementById('linkIndex').value = index;
    document.getElementById('linkTitle').value = link.title;
    document.getElementById('linkUrl').value = link.url;
    document.getElementById('linkIcon').value = link.icon;
    linkModal.classList.remove('hidden');
};

document.getElementById('addLinkBtn').addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = "Add New Link";
    document.getElementById('linkForm').reset();
    document.getElementById('linkIndex').value = "";
    linkModal.classList.remove('hidden');
});

document.getElementById('closeModalBtn').addEventListener('click', () => linkModal.classList.add('hidden'));

linkForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = linkForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    const index = document.getElementById('linkIndex').value;
    const newLink = {
        title: document.getElementById('linkTitle').value,
        url: document.getElementById('linkUrl').value,
        icon: document.getElementById('linkIcon').value || 'link'
    };

    setLoading(submitBtn, true, originalText);
    
    if (index !== "") {
        userLinks[index] = newLink;
    } else {
        userLinks.push(newLink);
    }

    try {
        await updateDoc(doc(db, "users", currentUser.uid), { links: userLinks });
        linkModal.classList.add('hidden');
        renderLinks();
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(submitBtn, false, originalText);
    }
});

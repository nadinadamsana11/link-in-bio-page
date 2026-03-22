import { 
    doc, 
    getDoc, 
    updateDoc, 
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let currentUser = null;
let userLinks = [];

const avatarPreview = document.getElementById('avatarPreview');
const photoInput = document.getElementById('photoInput');
const displayNameInput = document.getElementById('displayName');
const usernameInput = document.getElementById('dashboardUsername');
const bioInput = document.getElementById('bio');
const bioCounter = document.getElementById('bioCounter');
const linksListEl = document.getElementById('linksList');
const linkModal = document.getElementById('linkModal');
const linkForm = document.getElementById('linkForm');

// Observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        loadUserData();
    } else {
        window.location.href = '../auth/login.html';
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
        
        updateIdentityBadge(data);
        renderLinks();
    }
}

function updateIdentityBadge(data) {
    document.getElementById('badgeName').textContent = data.displayName || data.username;
    document.getElementById('badgeUsername').textContent = `@${data.username}`;
    document.getElementById('badgeBio').textContent = data.bio || "No bio added yet.";
    document.getElementById('linkCount').textContent = data.links?.length || 0;
    
    if (data.photoURL) {
        avatarPreview.innerHTML = `<img src="${data.photoURL}" class="w-full h-full object-cover">`;
    } else {
        avatarPreview.innerHTML = `<div class="w-full h-full bg-slate-800 flex items-center justify-center text-4xl font-black text-slate-700">${(data.displayName || data.username)[0].toUpperCase()}</div>`;
    }
    
    if (data.createdAt) {
        const date = new Date(data.createdAt);
        document.getElementById('memberSince').textContent = date.getFullYear();
    }

    document.getElementById('publicProfileBtn').href = `../profile/view.html?u=${data.username}`;
    updateBioCounter();
}

// WebP Processor
async function processToWebP(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.8);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Username Uniqueness
async function isUsernameAvailable(username, uid) {
    const q = query(collection(db, "users"), where("username", "==", username.toLowerCase()));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return true;
    return snapshot.docs[0].id === uid;
}

// Bio Counter
const updateBioCounter = () => {
    bioCounter.textContent = `${bioInput.value.length}/150`;
};
bioInput.addEventListener('input', updateBioCounter);

const setLoading = (btn, isLoading, originalContent) => {
    if (!btn) return;
    if (isLoading) {
        btn.disabled = true;
        btn.classList.add('opacity-70', 'cursor-not-allowed');
        btn.innerHTML = `<span class="flex items-center justify-center gap-2 font-bold mb-0.5"><i data-lucide="loader-2" class="w-4 h-4 animate-spin text-white"></i> SECURING...</span>`;
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
    const newUsername = usernameInput.value.trim().toLowerCase();
    const originalText = saveProfileBtn.innerHTML;

    if (!newUsername) return alert("Username required");
    
    setLoading(saveProfileBtn, true, originalText);
    try {
        if (!(await isUsernameAvailable(newUsername, currentUser.uid))) {
            alert("Username is already taken!");
            return;
        }

        const updates = {
            displayName: displayNameInput.value,
            username: newUsername,
            bio: bioInput.value
        };

        await updateDoc(doc(db, "users", currentUser.uid), updates);
        updateIdentityBadge(updates);
        alert("Identity updated successfully!");
    } catch (error) {
        console.error(error);
        alert("Error updating identity.");
    } finally {
        setLoading(saveProfileBtn, false, originalText);
    }
});

// Photo Upload (Cloudinary Integration)
photoInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const webpBlob = await processToWebP(file);
        
        // Cloudinary Upload
        const formData = new FormData();
        formData.append('file', webpBlob);
        formData.append('upload_preset', 'link-in-bio-page');

        const response = await fetch('https://api.cloudinary.com/v1_1/dpwbixthd/image/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error("Cloudinary upload failed");
        
        const result = await response.json();
        const url = result.secure_url;
        
        await updateDoc(doc(db, "users", currentUser.uid), { photoURL: url });
        avatarPreview.innerHTML = `<img src="${url}" class="w-full h-full object-cover">`;
        alert("Identity photo updated via Cloudinary!");
    } catch (error) {
        console.error(error);
        alert("Photo upload failed.");
    }
});

// Link Management
function renderLinks() {
    if (userLinks.length === 0) {
        linksListEl.innerHTML = `
            <div class="col-span-1 md:col-span-2 text-center py-20 border-2 border-dashed border-slate-900 rounded-[2rem]">
                <p class="text-slate-600 font-medium">Your link library is empty.</p>
            </div>`;
        return;
    }

    linksListEl.innerHTML = userLinks.map((link, index) => `
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex flex-col gap-4 group hover:scale-[1.03] transition-all cursor-default">
            <div class="flex justify-between items-start">
                <div class="bg-slate-800 p-4 rounded-2xl text-slate-300">
                    <i data-lucide="${link.icon || 'link'}" class="w-6 h-6"></i>
                </div>
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="editLink(${index})" class="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-all">
                        <i data-lucide="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteLink(${index})" class="p-2 hover:bg-red-400/10 rounded-lg text-slate-500 hover:text-red-400 transition-all">
                        <i data-lucide="trash" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <div class="space-y-1">
                <h4 class="font-black text-lg text-slate-100">${link.title}</h4>
                <p class="text-xs text-slate-500 truncate pb-2 uppercase tracking-widest font-bold">${link.url.replace('https://', '')}</p>
            </div>
            <a href="${link.url}" target="_blank" class="mt-2 text-xs font-bold bg-slate-800 py-3 rounded-xl text-center hover:bg-slate-700 transition-colors uppercase tracking-widest">
                Test Destination
            </a>
        </div>
    `).join('');
    lucide.createIcons();
}

window.deleteLink = async (index) => {
    if (!confirm("Remove this entry from your library?")) return;
    userLinks.splice(index, 1);
    await updateDoc(doc(db, "users", currentUser.uid), { links: userLinks });
    renderLinks();
    document.getElementById('linkCount').textContent = userLinks.length;
};

window.editLink = (index) => {
    const link = userLinks[index];
    document.getElementById('modalTitle').textContent = "Edit Identity Link";
    document.getElementById('linkIndex').value = index;
    document.getElementById('linkTitle').value = link.title;
    document.getElementById('linkUrl').value = link.url;
    document.getElementById('linkIcon').value = link.icon;
    linkModal.classList.remove('hidden');
};

document.getElementById('addLinkBtn').addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = "Add New Entry";
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
        document.getElementById('linkCount').textContent = userLinks.length;
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(submitBtn, false, originalText);
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = '../auth/login.html');
});

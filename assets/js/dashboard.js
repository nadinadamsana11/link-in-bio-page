import { auth, db, storage } from './firebase-config.js';
import { 
    doc, 
    getDoc, 
    updateDoc, 
    setDoc,
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
import { showToast, calculateAge } from './utils.js';

let currentUser = null;
let userLinks = [];
let currentStep = 1;

const avatarPreview = document.getElementById('avatarPreview');
const coverPhoto = document.getElementById('coverPhoto');
const photoInput = document.getElementById('photoInput');
const editPhotoBtn = document.getElementById('editPhotoBtn');
const coverPhotoInput = document.getElementById('coverPhotoInput');
const editCoverBtn = document.getElementById('editCoverBtn');
const linksListEl = document.getElementById('linksList');
const linkModal = document.getElementById('linkModal');
const linkForm = document.getElementById('linkForm');

// Dropdown Elements
const profileDropdownBtn = document.getElementById('profileDropdownBtn');
const profileDropdown = document.getElementById('profileDropdown');
const navEmail = document.getElementById('navEmail');
const navAvatar = document.getElementById('navAvatar');
const dropdownEmail = document.getElementById('dropdownEmail');

// Observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        if (navEmail) navEmail.textContent = user.email;
        if (dropdownEmail) dropdownEmail.textContent = user.email;
        loadUserData();
    } else {
        window.location.href = '../auth/login.html';
    }
});

// Dropdown Toggle
profileDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('hidden');
});

document.addEventListener('click', () => profileDropdown.classList.add('hidden'));
profileDropdown.addEventListener('click', (e) => e.stopPropagation());

async function loadUserData() {
    const userDocRef = doc(db, "users", currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    let data;
    if (userDoc.exists()) {
        data = userDoc.data();
    } else {
        // Auto-populate defaults from Auth
        const emailPrefix = currentUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        data = {
            displayName: currentUser.displayName || emailPrefix,
            username: emailPrefix,
            email: currentUser.email,
            photoURL: currentUser.photoURL || "",
            bio: "",
            dob: "",
            home: "",
            tel: "",
            gender: "",
            links: [],
            createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, data);
        showToast("Welcome! Your Identity Badge has been initialized.", "success");
    }

    userLinks = data.links || [];
    
    updateIdentityBadge(data);
    renderLinks();
}

function updateIdentityBadge(data) {
    const name = data.displayName || data.username || "Creator";
    
    const setElText = (id, text) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = text;
            el.classList.remove('skeleton');
            // Remove skeleton from parent/children if they have it
            const skel = el.querySelector('.skeleton') || (el.classList.contains('skeleton') ? el : null);
            if (skel) skel.classList.remove('skeleton');
            if (el.parentElement.classList.contains('skeleton')) el.parentElement.classList.remove('skeleton');
        }
    };

    setElText('badgeName', name);
    setElText('badgeUsername', data.username ? `@${data.username}` : "@handle");
    setElText('badgeBio', data.bio || "Tell the world your story.");
    setElText('linkCount', data.links?.length || 0);
    
    // Expanded Data
    setElText('badgeDOB', data.dob || "N/A");
    setElText('badgeAge', calculateAge(data.dob));
    setElText('badgeGender', data.gender || "N/A");
    setElText('badgeHome', data.home || "N/A");
    setElText('badgeTel', data.tel || "N/A");
    setElText('badgeEmail', data.email || currentUser?.email || "N/A");
    
    // Follower Stats (Simulation for UI)
    setElText('followerCount', "4.6K followers • 2.8K following");

    // Avatar
    const photoContent = data.photoURL 
        ? `<img src="${data.photoURL}" class="w-full h-full object-cover">`
        : `<div class="w-full h-full bg-[var(--c-accent)] flex items-center justify-center text-4xl font-black text-[var(--c-bg)] italic">${name[0].toUpperCase()}</div>`;
    
    if (avatarPreview) {
        avatarPreview.innerHTML = photoContent;
        avatarPreview.classList.remove('skeleton');
    }

    
    // Nav Avatar
    if (navAvatar) {
        const navInitial = name[0].toUpperCase();
        navAvatar.innerHTML = data.photoURL 
            ? `<img src="${data.photoURL}" class="w-full h-full object-cover">`
            : navInitial;
        navAvatar.classList.remove('skeleton');
        const navSkel = navAvatar.querySelector('.skeleton');
        if (navSkel) navSkel.remove();
    }

    // Cover Photo
    if (coverPhoto) {
        const coverContent = data.coverURL 
            ? `<img src="${data.coverURL}" class="w-full h-full object-cover">`
            : `<div class="w-full h-full bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-page)]"></div>`;
        coverPhoto.innerHTML = coverContent;
        coverPhoto.classList.remove('skeleton');
    }
    
    if (data.username) {
        const publicBtn = document.getElementById('publicProfileBtn');
        if (publicBtn) publicBtn.href = `../profile/view.html?u=${data.username}`;
    }
}

// WebP Processor
async function processToWebP(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 1000;
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
                canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.85);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function updateBioCounter() {
    // This is now purely for visual sync if bio is displayed
}

const setLoading = (btn, isLoading, originalContent) => {
    if (!btn) return;
    if (isLoading) {
        btn.disabled = true;
        btn.classList.add('opacity-70', 'cursor-not-allowed');
        btn.innerHTML = `<span class="flex items-center justify-center gap-2 font-bold mb-0.5"><i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> SECURING...</span>`;
        if (window.lucide) window.lucide.createIcons();
    } else {
        btn.disabled = false;
        btn.classList.remove('opacity-70', 'cursor-not-allowed');
        btn.innerHTML = originalContent;
        if (window.lucide) window.lucide.createIcons();
    }
};



// Portrait Update Logic
if (editPhotoBtn) {
    editPhotoBtn.addEventListener('click', () => photoInput.click());
}

if (photoInput) {
    photoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const webpBlob = await processToWebP(file);
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
            
            await setDoc(doc(db, "users", currentUser.uid), { photoURL: url }, { merge: true });
            
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            updateIdentityBadge(userDoc.data());
            
            showToast("Identity Portrait Secured!", "success");
        } catch (error) {
            console.error(error);
            showToast("Portrait upload failed.", "error");
        }
    });
}

// Cover Photo Update Logic
if (editCoverBtn) {
    editCoverBtn.addEventListener('click', () => coverPhotoInput.click());
}

if (coverPhotoInput) {
    coverPhotoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const webpBlob = await processToWebP(file);
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
            
            await setDoc(doc(db, "users", currentUser.uid), { coverURL: url }, { merge: true });
            
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            updateIdentityBadge(userDoc.data());
            
            showToast("Cover Presence Secured!", "success");
        } catch (error) {
            console.error(error);
            showToast("Cover upload failed: " + (error.message || "Unknown error"), "error");
        }
    });
}

// Link Management
function renderLinks() {
    if (userLinks.length === 0) {
        linksListEl.innerHTML = `
            <div class="col-span-1 md:col-span-2 text-center py-20 border-2 border-dashed border-[var(--border-subtle)] rounded-[2rem]">
                <p class="text-[var(--text-dim)] font-medium">Your link library is empty.</p>
            </div>`;
        return;
    }

    linksListEl.innerHTML = userLinks.map((link, index) => `
        <div class="bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 rounded-[2rem] flex flex-col gap-4 group hover:scale-[1.03] transition-all cursor-default">
            <div class="flex justify-between items-start">
                <div class="bg-[var(--bg-card-hover)] p-4 rounded-2xl text-[var(--text-muted)]">
                    <i data-lucide="${link.icon || 'link'}" class="w-6 h-6"></i>
                </div>
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="editLink(${index})" class="p-2 hover:bg-[var(--bg-card-hover)] rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] transition-all">
                        <i data-lucide="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteLink(${index})" class="p-2 hover:bg-red-400/10 rounded-lg text-[var(--text-dim)] hover:text-red-400 transition-all">
                        <i data-lucide="trash" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <div class="space-y-1">
                <h4 class="font-black text-lg text-[var(--text-main)]">${link.title}</h4>
                <p class="text-xs text-[var(--text-muted)] truncate pb-2 uppercase tracking-widest font-bold">${link.url.replace('https://', '')}</p>
            </div>
            <a href="${link.url}" target="_blank" class="mt-2 text-xs font-bold bg-[var(--bg-card-hover)] py-3 rounded-xl text-center hover:bg-[var(--bg-page)] transition-colors uppercase tracking-widest text-[var(--text-main)]">
                Test Destination
            </a>
        </div>
    `).join('');
    lucide.createIcons();
}

window.deleteLink = async (index) => {
    if (!confirm("Remove this entry from your library?")) return;
    try {
        userLinks.splice(index, 1);
        await setDoc(doc(db, "users", currentUser.uid), { links: userLinks }, { merge: true });
        renderLinks();
        document.getElementById('linkCount').textContent = userLinks.length;
        showToast("Entry removed", "info");
    } catch (err) {
        showToast("Failed to remove item", "error");
    }
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
        await setDoc(doc(db, "users", currentUser.uid), { links: userLinks }, { merge: true });
        linkModal.classList.add('hidden');
        renderLinks();
        document.getElementById('linkCount').textContent = userLinks.length;
        showToast("Library updated successfully!", "success");
    } catch (error) {
        console.error(error);
        showToast("Failed to save link. Please try again.", "error");
    } finally {
        setLoading(submitBtn, false, originalText);
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = '../auth/login.html');
});

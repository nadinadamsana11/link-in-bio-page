import { db } from './firebase-config.js';
import { 
    collection, 
    query, 
    where, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { calculateAge } from './utils.js';

const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('u');

if (username) {
    loadPublicProfile();
} else {
    document.body.innerHTML = `<div class="p-20 text-center font-black text-[var(--text-muted)] uppercase tracking-widest">Ghost Identity: No User Found</div>`;
}

async function loadPublicProfile() {
    const q = query(collection(db, "users"), where("username", "==", username.toLowerCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        document.body.innerHTML = `<div class="p-20 text-center font-black text-[var(--text-muted)] uppercase tracking-widest">Ghost Identity: No User Found</div>`;
        return;
    }

    const data = snapshot.docs[0].data();
    renderProfile(data);
}

function renderProfile(data) {
    const setElText = (id, text) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = text;
            el.classList.remove('skeleton');
            // Remove skeleton from parent/children
            const skel = el.querySelector('.skeleton') || (el.classList.contains('skeleton') ? el : null);
            if (skel) skel.classList.remove('skeleton');
            if (el.parentElement.classList.contains('skeleton')) el.parentElement.classList.remove('skeleton');
        }
    };

    setElText('badgeName', data.displayName || data.username);
    setElText('badgeUsername', data.username ? `@${data.username}` : "@handle");
    setElText('badgeBio', data.bio || "Tell the world your story.");
    
    // Expanded Fields
    setElText('badgeDOB', data.dob || "N/A");
    setElText('badgeAge', calculateAge(data.dob));
    setElText('badgeGender', data.gender || "N/A");
    setElText('badgeHome', data.home || "N/A");
    setElText('badgeTel', data.tel || "N/A");
    setElText('badgeEmail', data.email || "N/A");

    // Avatar
    const avatarPreview = document.getElementById('avatarPreview');
    if (avatarPreview) {
        const photoContent = data.photoURL 
            ? `<img src="${data.photoURL}" class="w-full h-full object-cover">`
            : `<div class="w-full h-full bg-[var(--c-accent)] flex items-center justify-center text-5xl font-black text-[var(--c-bg)]">${(data.displayName || data.username)[0].toUpperCase()}</div>`;
        avatarPreview.innerHTML = photoContent;
        avatarPreview.classList.remove('skeleton');
    }

    // Cover Photo
    const coverPhoto = document.getElementById('coverPhoto');
    if (coverPhoto) {
        const coverContent = data.coverURL 
            ? `<img src="${data.coverURL}" class="w-full h-full object-cover">`
            : `<div class="w-full h-full bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-page)]"></div>`;
        coverPhoto.innerHTML = coverContent;
        coverPhoto.classList.remove('skeleton');
    }

    const linksList = document.getElementById('linksList');
    if (linksList) {
        linksList.classList.remove('skeleton'); // Remove skeleton from container
        if (data.links && data.links.length > 0) {
            linksList.innerHTML = data.links.map(link => `
                <a href="${link.url}" target="_blank" class="bg-[var(--bg-card)] border border-[var(--border-subtle)] p-8 rounded-[2.5rem] flex flex-col gap-5 group hover:scale-[1.03] hover:border-[var(--c-primary)]/30 transition-all border-glow text-[var(--text-main)]">
                    <div class="flex justify-between items-start">
                        <div class="bg-[var(--bg-card-hover)] p-5 rounded-2xl text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">
                            <i data-lucide="${link.icon || 'link'}" class="w-7 h-7"></i>
                        </div>
                        <div class="bg-[var(--bg-card-hover)]/40 p-2 rounded-lg group-hover:bg-[var(--c-primary)]/10 transition-colors">
                            <i data-lucide="arrow-up-right" class="w-4 h-4 text-[var(--text-dim)] group-hover:text-[var(--c-primary)]"></i>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-black text-xl text-[var(--text-main)] mb-1 group-hover:text-[var(--c-primary)] transition-colors">${link.title}</h4>
                        <p class="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest truncate">${link.url.replace('https://', '')}</p>
                    </div>
                </a>
            `).join('');
            lucide.createIcons();
        } else {
            linksList.innerHTML = `<div class="col-span-full py-20 text-center text-sm font-bold opacity-50">No destination entries discovered yet.</div>`;
        }
    }
}

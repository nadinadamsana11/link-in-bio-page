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
    document.body.innerHTML = `<div class="p-20 text-center font-black text-slate-500 uppercase tracking-widest">Ghost Identity: No User Found</div>`;
}

async function loadPublicProfile() {
    const q = query(collection(db, "users"), where("username", "==", username.toLowerCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        document.body.innerHTML = `<div class="p-20 text-center font-black text-slate-500 uppercase tracking-widest">Ghost Identity: No User Found</div>`;
        return;
    }

    const data = snapshot.docs[0].data();
    renderProfile(data);
}

function renderProfile(data) {
    const setElText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setElText('badgeName', data.displayName || data.username);
    setElText('badgeUsername', data.username ? `@${data.username}` : "@handle");
    setElText('badgeBio', data.bio || "");
    
    // Expanded Fields
    setElText('badgeDOB', data.dob || "N/A");
    setElText('badgeAge', calculateAge(data.dob));
    setElText('badgeGender', data.gender || "N/A");
    setElText('badgeHome', data.home || "N/A");
    setElText('badgeTel', data.tel || "N/A");
    setElText('badgeEmail', data.email || "N/A");

    const avatarPreview = document.getElementById('avatarPreview');
    const photoContent = data.photoURL 
        ? `<img src="${data.photoURL}" class="w-full h-full object-cover">`
        : `<div class="w-full h-full bg-slate-800 flex items-center justify-center text-5xl font-black text-slate-700">${(data.displayName || data.username)[0].toUpperCase()}</div>`;
    
    avatarPreview.innerHTML = photoContent;

    const linksList = document.getElementById('linksList');
    if (data.links && data.links.length > 0) {
        linksList.innerHTML = data.links.map(link => `
            <a href="${link.url}" target="_blank" class="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] flex flex-col gap-5 group hover:scale-[1.03] hover:border-emerald-500/30 transition-all border-glow">
                <div class="flex justify-between items-start">
                    <div class="bg-slate-800 p-5 rounded-2xl text-slate-300 group-hover:text-white transition-colors">
                        <i data-lucide="${link.icon || 'link'}" class="w-7 h-7"></i>
                    </div>
                    <div class="bg-slate-800/40 p-2 rounded-lg group-hover:bg-emerald-500/10 transition-colors">
                        <i data-lucide="arrow-up-right" class="w-4 h-4 text-slate-500 group-hover:text-emerald-400"></i>
                    </div>
                </div>
                <div>
                    <h4 class="font-black text-xl text-slate-100 mb-1 group-hover:text-emerald-400 transition-colors">${link.title}</h4>
                    <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">${link.url.replace('https://', '')}</p>
                </div>
            </a>
        `).join('');
        lucide.createIcons();
    }
}

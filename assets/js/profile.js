import { db } from '../assets/js/firebase-config.js';
import { 
    collection, 
    query, 
    where, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const profileContent = document.getElementById('profileContent');
const loading = document.getElementById('loading');
const errorState = document.getElementById('errorState');
const profileLinks = document.getElementById('profileLinks');
const profileName = document.getElementById('profileName');
const profileBio = document.getElementById('profileBio');
const profilePhoto = document.getElementById('profilePhoto');

async function fetchProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('u');

    if (!username) {
        showError();
        return;
    }

    try {
        const q = query(collection(db, "users"), where("username", "==", username.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            showError();
            return;
        }

        const userData = querySnapshot.docs[0].data();
        displayProfile(userData);
    } catch (error) {
        console.error("Fetch Error:", error);
        showError();
    }
}

function displayProfile(data) {
    loading.classList.add('hidden');
    profileContent.classList.remove('hidden');

    document.getElementById('profileName').textContent = data.displayName || data.username;
    document.getElementById('profileUsername').textContent = `@${data.username}`;
    document.getElementById('profileBio').textContent = data.bio || "Welcome to my official profile.";
    
    if (data.photoURL) {
        profilePhoto.innerHTML = `<img src="${data.photoURL}" class="w-full h-full object-cover">`;
    } else {
        profilePhoto.innerHTML = `<div class="w-full h-full bg-slate-800 flex items-center justify-center text-5xl font-black text-slate-700">${(data.displayName || data.username)[0].toUpperCase()}</div>`;
    }

    if (data.links && data.links.length > 0) {
        profileLinks.innerHTML = data.links.map(link => `
            <a href="${link.url}" target="_blank" 
                class="block w-full bg-slate-900 border border-slate-800 p-6 rounded-[2rem] group hover:scale-[1.02] transition-all overflow-hidden relative">
                <div class="flex items-center gap-6 relative z-10">
                    <div class="bg-slate-800 p-4 rounded-2xl text-slate-400 group-hover:text-white transition-colors">
                        <i data-lucide="${link.icon || 'link'}" class="w-6 h-6"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-black text-xl text-slate-100">${link.title}</h4>
                        <p class="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1 group-hover:text-slate-400 transition-colors">${link.url.replace('https://', '')}</p>
                    </div>
                    <i data-lucide="chevron-right" class="w-5 h-5 text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all"></i>
                </div>
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </a>
        `).join('');
    } else {
        profileLinks.innerHTML = `<p class="text-center text-slate-500 italic mt-8 font-medium">No active links found.</p>`;
    }

    lucide.createIcons();
    document.title = `${data.displayName || data.username} | Digital Identity`;
}

function showError() {
    loading.classList.add('hidden');
    errorState.classList.remove('hidden');
}

fetchProfile();

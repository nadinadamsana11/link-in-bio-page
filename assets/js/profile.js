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

    profileName.textContent = data.displayName || data.username;
    profileBio.textContent = data.bio || "";
    
    if (data.photoURL) {
        profilePhoto.innerHTML = `<img src="${data.photoURL}" class="w-full h-full object-cover shadow-2xl">`;
    } else {
        profilePhoto.innerHTML = `<div class="w-full h-full bg-slate-800 flex items-center justify-center text-3xl font-bold text-slate-400">${data.username[0].toUpperCase()}</div>`;
    }

    if (data.links && data.links.length > 0) {
        profileLinks.innerHTML = data.links.map(link => `
            <a href="${link.url}" target="_blank" 
                class="profile-link block w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center font-bold text-slate-100 flex items-center justify-between px-6 group">
                <i data-lucide="${link.icon || 'link'}" class="w-5 h-5 text-slate-400 opacity-60 group-hover:opacity-100 transition-colors"></i>
                <span class="flex-1">${link.title}</span>
                <div class="w-5 h-5"></div>
            </a>
        `).join('');
    } else {
        profileLinks.innerHTML = `<p class="text-center text-slate-500 italic mt-8">No links shared yet.</p>`;
    }

    lucide.createIcons();
    document.title = `${data.displayName || data.username} | Link-in-Bio`;
}

function showError() {
    loading.classList.add('hidden');
    errorState.classList.remove('hidden');
}

fetchProfile();

import { auth, db } from '../assets/js/firebase-config.js';
import { 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    orderBy, 
    query 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const userTableBody = document.getElementById('userTableBody');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().isAdmin) {
            loadAllUsers();
        } else {
            alert("Unauthorized access. Admin only.");
            window.location.href = '../dashboard/index.html';
        }
    }
});

async function loadAllUsers() {
    try {
        const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            userTableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-12 text-center text-slate-500 italic">No users found.</td></tr>`;
            return;
        }

        userTableBody.innerHTML = querySnapshot.docs.map(userDoc => {
            const data = userDoc.data();
            const date = data.createdAt;
            
            return `
                <tr class="hover:bg-slate-800/30">
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
                                ${data.photoURL ? `<img src="${data.photoURL}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center text-xs text-slate-400 font-bold">${data.username ? data.username[0].toUpperCase() : '?'}</div>`}
                            </div>
                            <span class="font-medium text-slate-200">${data.displayName || 'No Name'}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-slate-400 text-sm">${data.email}</td>
                    <td class="px-6 py-4">
                        <span class="bg-slate-800 text-slate-300 px-2 py-1 rounded-md text-xs font-mono">@${data.username}</span>
                    </td>
                    <td class="px-6 py-4 text-slate-400 text-sm">${date ? new Date(date).toLocaleDateString() : 'N/A'}</td>
                    <td class="px-6 py-4 text-right">
                        <a href="../profile/view.html?u=${data.username}" target="_blank" class="text-slate-400 hover:text-white">
                            <i data-lucide="external-link" class="w-4 h-4 inline"></i>
                        </a>
                    </td>
                </tr>
            `;
        }).join('');
        lucide.createIcons();
    } catch (error) {
        console.error("Admin Load Error:", error);
        userTableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-12 text-center text-red-500">Error loading users. Check console.</td></tr>`;
    }
}

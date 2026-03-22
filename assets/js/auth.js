import { auth, db, googleProvider } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    signInWithPopup,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    query, 
    where, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { showToast } from './utils.js';

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const messageEl = document.getElementById('message');
const googleBtn = document.getElementById('googleLogin');
const magicLinkBtn = document.getElementById('magicLinkBtn');

const showMessage = (msg, isError = false) => {
    if (!messageEl) {
        showToast(msg, isError ? 'error' : 'success');
        return;
    }
    messageEl.textContent = msg;
    messageEl.className = `mt-4 text-center text-sm font-medium ${isError ? 'text-red-400' : 'text-emerald-400'}`;
    showToast(msg, isError ? 'error' : 'success');
};

const setLoading = (btn, isLoading, originalContent) => {
    if (!btn) return;
    if (isLoading) {
        btn.disabled = true;
        btn.classList.add('opacity-70', 'cursor-not-allowed');
        btn.innerHTML = `<span class="flex items-center gap-2"><i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Processing...</span>`;
        lucide.createIcons();
    } else {
        btn.disabled = false;
        btn.classList.remove('opacity-70', 'cursor-not-allowed');
        btn.innerHTML = originalContent;
        lucide.createIcons();
    }
};

// Handle Registration (Email/PWD)
if (registerForm) {
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        setLoading(submitBtn, true, originalBtnText);
        try {
            if (!(await isUnique("username", username))) {
                showMessage("Username is already taken", true);
                setLoading(submitBtn, false, originalBtnText);
                return;
            }
            if (!(await isUnique("email", email))) {
                showMessage("Email already associated with an account", true);
                setLoading(submitBtn, false, originalBtnText);
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await createUserData(userCredential.user, username);
            showMessage("Registration successful!");
            setTimeout(() => window.location.href = '../dashboard/index.html', 1500);
        } catch (error) {
            console.error(error);
            showMessage(error.message, true);
            setLoading(submitBtn, false, originalBtnText);
        }
    });
}

// Google Auth
if (googleBtn) {
    const originalBtnText = googleBtn.innerHTML;
    googleBtn.addEventListener('click', async () => {
        setLoading(googleBtn, true, originalBtnText);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (!userDoc.exists()) {
                let baseUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
                let finalUsername = baseUsername;
                let counter = 1;
                
                while (!(await isUnique("username", finalUsername))) {
                    finalUsername = `${baseUsername}${counter}`;
                    counter++;
                }
                
                await createUserData(user, finalUsername);
            }
            window.location.href = '../dashboard/index.html';
        } catch (error) {
            console.error(error);
            showMessage("Google Sign-in failed. Please try again.", true);
            setLoading(googleBtn, false, originalBtnText);
        }
    });
}

// Magic Link
if (magicLinkBtn) {
    const originalBtnText = magicLinkBtn.textContent;
    magicLinkBtn.addEventListener('click', async () => {
        const email = document.getElementById('email').value.trim();
        if (!email) {
            showMessage("Please enter your email first", true);
            return;
        }

        setLoading(magicLinkBtn, true, originalBtnText);
        const actionCodeSettings = {
            url: window.location.href,
            handleCodeInApp: true,
        };

        try {
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            window.localStorage.setItem('emailForSignIn', email);
            showMessage("Login link sent to your email!");
            setLoading(magicLinkBtn, false, originalBtnText);
        } catch (error) {
            showMessage(error.message, true);
            setLoading(magicLinkBtn, false, originalBtnText);
        }
    });
}

// Password Visibility Toggle
document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = btn.parentElement.querySelector('input');
        const icon = btn.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.setAttribute('data-lucide', 'eye-off');
        } else {
            input.type = 'password';
            icon.setAttribute('data-lucide', 'eye');
        }
        lucide.createIcons();
    });
});

// Create User Data (Production Grade)
async function createUserData(user, username) {
    const userRef = doc(db, "users", user.uid);
    const userData = {
        uid: user.uid,
        username: username.toLowerCase(),
        email: user.email.toLowerCase(),
        displayName: user.displayName || username,
        bio: "Professional Creator",
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        links: [
            { title: "My Portfolio", url: "https://example.com", icon: "globe" },
            { title: "Follow me on Twitter", url: "https://twitter.com", icon: "twitter" }
        ],
        isAdmin: false,
        createdAt: new Date().toISOString()
    };
    await setDoc(userRef, userData);
}

// Handle Login (Email/PWD)
if (loginForm) {
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        setLoading(submitBtn, true, originalBtnText);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = '../dashboard/index.html';
        } catch (error) {
            showMessage("Invalid email or password", true);
            setLoading(submitBtn, false, originalBtnText);
        }
    });
}

// Logout & Observer
window.logout = async () => {
    await signOut(auth);
    window.location.href = '../auth/login.html';
};

onAuthStateChanged(auth, (user) => {
    const path = window.location.pathname;
    const isProtected = path.includes('dashboard') || path.includes('admin');
    const isAuthPage = path.includes('login.html') || path.includes('register.html');
    
    if (user && isAuthPage) {
        window.location.href = '../dashboard/index.html';
    } else if (!user && isProtected) {
        window.location.href = '../auth/login.html';
    }
});

/**
 * Layout.js - Global UI Orchestration
 * Handles unified Header, Footer, and Vanity URL Routing
 */

import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const isRoot = window.location.pathname === '/' || window.location.pathname.endsWith('index.html') && !window.location.pathname.includes('/dashboard/') && !window.location.pathname.includes('/admin/');
const pathPrefix = isRoot ? '' : (window.location.pathname.includes('/pages/') || window.location.pathname.includes('/auth/') || window.location.pathname.includes('/dashboard/') || window.location.pathname.includes('/profile/') || window.location.pathname.includes('/admin/')) ? '../' : './';

export function renderGlobalUI() {
    injectHeader();
    injectFooter();
    handleVanityURL();
}

function injectHeader() {
    const header = document.querySelector('nav'); // Targeting existing nav for replacement or just finding/injecting
    if (!header) return;

    // We keep specific headers for Dashboard and Profile but unify the Landing/Auth/Pages
    const isSpecialPage = window.location.pathname.includes('/dashboard/') || window.location.pathname.includes('/profile/') || window.location.pathname.includes('/admin/');
    if (isSpecialPage) return; // Dashboard or Profile handle their own complex headers

    header.innerHTML = `
        <div class="max-w-7xl mx-auto flex justify-between items-center w-full px-6">
            <div id="nav-logo" class="flex items-center gap-2">
                <div class="bg-slate-800 p-2 rounded-xl border border-slate-700">
                    <i data-lucide="zap" class="w-6 h-6 text-white"></i>
                </div>
                <a href="${pathPrefix}index.html" class="font-bold text-2xl tracking-tighter hover:text-slate-300 transition-colors italic">Link-in-Bio</a>
            </div>
            
            <div id="nav-actions" class="flex items-center gap-4 md:gap-6">
                <a href="${pathPrefix}pages/pro.html" class="hidden sm:flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-5 py-2 rounded-full border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all">
                    <i data-lucide="crown" class="w-3 h-3"></i>
                    Get Pro
                </a>
                ${!window.location.pathname.includes('/profile/') && !window.location.pathname.includes('@') ? `<a href="${pathPrefix}auth/login.html" class="text-slate-400 hover:text-white transition-all font-bold text-xs uppercase tracking-widest px-2">Log In</a>` : ''}
                <a href="${pathPrefix}auth/register.html" class="bg-white text-slate-950 px-7 py-2.5 rounded-full shadow-xl transition-all font-black text-[10px] uppercase tracking-widest hover:bg-slate-200">Start Now</a>
            </div>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();
}

function injectFooter() {
    let footer = document.querySelector('footer');
    if (!footer) {
        footer = document.createElement('footer');
        document.body.appendChild(footer);
    }

    // Ensure only one footer exists
    const allFooters = document.querySelectorAll('footer');
    if (allFooters.length > 1) {
        allFooters.forEach((f, i) => { if (i > 0) f.remove(); });
        footer = document.querySelector('footer');
    }

    // Full-width background classes
    footer.className = "w-full bg-slate-950 border-t border-slate-900 pt-20 pb-10 mt-auto relative z-10 overflow-hidden";
    footer.innerHTML = `
        <div class="max-w-7xl mx-auto px-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                <div class="col-span-1 md:col-span-1 space-y-6">
                    <div class="flex items-center gap-2">
                        <i data-lucide="zap" class="w-6 h-6 text-white"></i>
                        <span class="font-bold text-xl italic">Link-in-Bio</span>
                    </div>
                    <p class="text-slate-500 text-sm">The easy way to share all your links in one place.</p>
                    <div class="flex gap-4">
                        <a href="#" class="text-slate-500 hover:text-white transition-colors"><i data-lucide="twitter" class="w-5 h-5"></i></a>
                        <a href="#" class="text-slate-500 hover:text-white transition-colors"><i data-lucide="instagram" class="w-5 h-5"></i></a>
                        <a href="#" class="text-slate-500 hover:text-white transition-colors"><i data-lucide="github" class="w-5 h-5"></i></a>
                    </div>
                </div>
                <div>
                    <h4 class="font-bold mb-6 text-white text-sm uppercase tracking-widest">Main Pages</h4>
                    <ul class="space-y-4 text-xs font-bold text-slate-500">
                        <li><a href="${pathPrefix}index.html" class="hover:text-white transition-colors uppercase">Home</a></li>
                        <li><a href="${pathPrefix}pages/pro.html" class="hover:text-white transition-colors uppercase">Get Pro</a></li>
                        <li><a href="${pathPrefix}auth/register.html" class="hover:text-white transition-colors uppercase">Join Now</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-6 text-white text-sm uppercase tracking-widest">Help</h4>
                    <ul class="space-y-4 text-xs font-bold text-slate-500">
                        <li><a href="${pathPrefix}pages/contact.html" class="hover:text-white transition-colors uppercase">Contact Support</a></li>
                        <li><a href="${pathPrefix}pages/privacy.html" class="hover:text-white transition-colors uppercase">Privacy Rules</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-6 text-white text-sm uppercase tracking-widest">About the app</h4>
                    <p class="text-slate-500 text-xs mb-6 leading-relaxed">This app helps you put all your social links on one simple page.</p>
                    <a href="${pathPrefix}pages/about.html" class="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all text-white">
                        Learn about us
                        <i data-lucide="arrow-right" class="w-3 h-3"></i>
                    </a>
                </div>
            </div>
            <div class="text-center pt-10 border-t border-slate-900 text-slate-700 text-[10px] font-black uppercase tracking-[0.2em]">
                &copy; 2026 Link-in-Bio Platform. Made for everyone.
            </div>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();
}

function handleVanityURL() {
    // If the path is just /@username, redirect to profile/view.html?u=username
    const path = window.location.pathname;
    const parts = path.split('/');
    const lastPart = parts[parts.length - 1] || parts[parts.length - 2];
    
    if (lastPart && lastPart.startsWith('@')) {
        const username = lastPart.substring(1);
        window.location.href = `${pathPrefix}profile/view.html?u=${username}`;
    }
}

// Auto-run if imported without calling specifically
renderGlobalUI();

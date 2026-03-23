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
    const header = document.querySelector('header');
    if (!header) return;

    // We keep specific headers for Dashboard and Profile but unify the Landing/Auth/Pages
    const isSpecialPage = window.location.pathname.includes('/dashboard/') || window.location.pathname.includes('/profile/') || window.location.pathname.includes('/admin/');
    header.className = "fixed top-0 w-full z-[100] transition-all duration-500 bg-[var(--glass-bg)] backdrop-blur-xl border-b border-[var(--border-subtle)]";
    header.innerHTML = `
        <div class="w-full flex justify-between items-center px-6 md:px-12 h-20">
            <div id="nav-logo" class="flex items-center gap-2">
                <div class="bg-[var(--bg-card)] p-2 rounded-xl border border-[var(--border-subtle)]">
                    <i data-lucide="zap" class="w-6 h-6 text-[var(--text-on-light)]"></i>
                </div>
                <a href="${pathPrefix}index.html" class="font-black text-xl md:text-2xl tracking-tighter hover:opacity-70 transition-colors italic text-[var(--text-main)]">Link-in-Bio</a>
            </div>
            
            <div id="nav-actions" class="flex items-center gap-3 md:gap-8">
                <a href="${pathPrefix}pages/pro.html" class="hidden sm:inline-flex btn-nav-premium">
                    <i data-lucide="crown" class="w-3 h-3"></i>
                    Get Pro
                </a>
                ${!window.location.pathname.includes('/profile/') && !window.location.pathname.includes('@') ? `<a href="${pathPrefix}auth/login.html" class="btn-nav-login font-bold text-xs uppercase tracking-widest px-2">Log In</a>` : ''}
                <a href="${pathPrefix}auth/register.html" class="bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] px-6 md:px-10 py-3 rounded-full shadow-2xl transition-all font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95">Start Now</a>
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
    footer.className = "w-full bg-[var(--bg-page)] border-t border-[var(--border-subtle)] pt-20 pb-10 mt-auto relative z-10 overflow-hidden";
    footer.innerHTML = `
        <div class="max-w-7xl mx-auto px-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                <div class="col-span-1 md:col-span-1 space-y-6">
                    <div class="flex items-center gap-2 text-[var(--text-main)]">
                        <i data-lucide="zap" class="w-6 h-6"></i>
                        <span class="font-bold text-xl italic">Link-in-Bio</span>
                    </div>
                    <p class="text-[var(--text-muted)] text-sm">The easy way to share all your links in one place.</p>
                    <div class="flex gap-4">
                        <a href="#" class="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"><i data-lucide="twitter" class="w-5 h-5"></i></a>
                        <a href="#" class="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"><i data-lucide="instagram" class="w-5 h-5"></i></a>
                        <a href="#" class="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"><i data-lucide="github" class="w-5 h-5"></i></a>
                    </div>
                </div>
                <div>
                    <h4 class="font-bold mb-6 text-[var(--text-main)] text-sm uppercase tracking-widest">Main Pages</h4>
                    <ul class="space-y-4 text-xs font-bold text-[var(--text-muted)]">
                        <li><a href="${pathPrefix}index.html" class="hover:text-[var(--text-main)] transition-colors uppercase">Home</a></li>
                        <li><a href="${pathPrefix}pages/pro.html" class="hover:text-[var(--text-main)] transition-colors uppercase">Get Pro</a></li>
                        <li><a href="${pathPrefix}auth/register.html" class="hover:text-[var(--text-main)] transition-colors uppercase">Join Now</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-6 text-[var(--text-main)] text-sm uppercase tracking-widest">Help</h4>
                    <ul class="space-y-4 text-xs font-bold text-[var(--text-muted)]">
                        <li><a href="${pathPrefix}pages/contact.html" class="hover:text-[var(--text-main)] transition-colors uppercase">Contact Support</a></li>
                        <li><a href="${pathPrefix}pages/privacy.html" class="hover:text-[var(--text-main)] transition-colors uppercase">Privacy Rules</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-6 text-[var(--text-main)] text-sm uppercase tracking-widest">Support the project</h4>
                    <p class="text-[var(--text-muted)] text-xs mb-6 leading-relaxed">Help us keep the app free for everyone.</p>
                    <div class="flex flex-col gap-3">
                        <a href="https://www.buymeacoffee.com" target="_blank" class="inline-flex items-center gap-3 btn-support-yellow px-6 py-3 rounded-full text-[10px] uppercase tracking-widest transition-all shadow-xl">
                            <i data-lucide="coffee" class="w-4 h-4"></i>
                            Buy me a coffee
                        </a>
                        <a href="${pathPrefix}pages/about.html" class="inline-flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[var(--bg-card-hover)] transition-all text-[var(--text-on-light)] shadow-sm">
                            Learn about us
                            <i data-lucide="arrow-right" class="w-3 h-3 text-[var(--c-secondary)]"></i>
                        </a>
                    </div>
                </div>
            </div>
            <div class="text-center pt-10 border-t border-[var(--border-subtle)] text-[var(--text-dim)] text-[10px] font-black uppercase tracking-[0.2em]">
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

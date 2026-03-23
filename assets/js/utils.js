// Utility functions for the Link-in-Bio platform

/**
 * Shows a custom toast notification
 * @param {string} message - The message to display
 * @param {'success' | 'error' | 'info'} type - The type of notification
 */
export function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    
    // Create container if it doesn't exist
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-8 right-8 z-[200] flex flex-col gap-4 pointer-events-none';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const colors = {
        success: 'bg-[var(--c-primary)] text-[var(--c-bg)] border-[var(--border-subtle)]',
        error: 'bg-[var(--c-bg)] text-[var(--c-primary)] border-[var(--c-primary)]/20',
        info: 'bg-[var(--c-accent)] text-[var(--c-primary)] border-[var(--c-secondary)]/10'
    };
    
    const icons = {
        success: 'check-circle',
        error: 'alert-circle',
        info: 'info'
    };

    toast.className = `${colors[type]} border px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 transition-all duration-500 translate-y-20 opacity-0 pointer-events-auto min-w-[300px] border-glow animate-slide-up`;
    
    toast.innerHTML = `
        <i data-lucide="${icons[type]}" class="w-5 h-5 flex-shrink-0"></i>
        <p class="text-xs font-black uppercase tracking-widest leading-relaxed">${message}</p>
    `;

    container.appendChild(toast);
    
    if (window.lucide) window.lucide.createIcons();

    // Trigger animate-in
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-20', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    });

    // Auto-remove
    setTimeout(() => {
        toast.classList.add('translate-y-4', 'opacity-0');
        setTimeout(() => {
            toast.remove();
            if (container.children.length === 0) container.remove();
        }, 500);
    }, 4000);
}

/**
 * Calculates age from a date of birth string
 * @param {string} dob - Format 'YYYY-MM-DD'
 * @returns {number | string} - Age or N/A
 */
export function calculateAge(dob) {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// Format time as MM:SS
export function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Calculate progress percentage
export function calculateProgress(current, total) {
    return Math.max(0, Math.min(100, (current / total) * 100));
}

// Get today's date in YYYY-MM-DD format
export function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

// Check if it's past office hours
export function isPastOfficeHours(officeEndTime) {
    const now = new Date();
    const [hours, minutes] = officeEndTime.split(':').map(Number);
    const endTime = new Date();
    endTime.setHours(hours, minutes, 0, 0);
    return now >= endTime;
}

// Get greeting based on time of day
export function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
}

// Storage helpers
export const storage = {
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch {
            return defaultValue;
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Storage error:', e);
        }
    },
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Storage error:', e);
        }
    }
};

// Timer state persistence
export const timerStorage = {
    TIMER_KEY: 'zencycle_timer_state',
    
    save: (state) => {
        storage.set(timerStorage.TIMER_KEY, {
            ...state,
            savedAt: Date.now()
        });
    },
    
    load: () => {
        const state = storage.get(timerStorage.TIMER_KEY);
        if (!state) return null;
        
        // Calculate elapsed time since save
        const elapsed = Math.floor((Date.now() - state.savedAt) / 1000);
        
        if (state.isRunning) {
            const newTimeLeft = Math.max(0, state.timeLeft - elapsed);
            return {
                ...state,
                timeLeft: newTimeLeft,
                isRunning: newTimeLeft > 0
            };
        }
        
        return state;
    },
    
    clear: () => {
        storage.remove(timerStorage.TIMER_KEY);
    }
};

// Auth helpers
export const authStorage = {
    TOKEN_KEY: 'zencycle_token',
    USER_KEY: 'zencycle_user',
    
    getToken: () => storage.get(authStorage.TOKEN_KEY),
    setToken: (token) => storage.set(authStorage.TOKEN_KEY, token),
    removeToken: () => storage.remove(authStorage.TOKEN_KEY),
    
    getUser: () => storage.get(authStorage.USER_KEY),
    setUser: (user) => storage.set(authStorage.USER_KEY, user),
    removeUser: () => storage.remove(authStorage.USER_KEY),
    
    clear: () => {
        authStorage.removeToken();
        authStorage.removeUser();
    }
};

import { writable } from 'svelte/store';

type Toast = {
    message: string;
    type: 'success' | 'error' | 'info';
    id: number;
};

function createToastStore() {
    const { subscribe, update } = writable<Toast[]>([]);

    return {
        subscribe,
        show: (message: string, type: Toast['type'] = 'info') => {
            const id = Date.now();
            update(toasts => [...toasts, { message, type, id }]);
            setTimeout(() => {
                update(toasts => toasts.filter(t => t.id !== id));
            }, 3000);
        }
    };
}

export const toastStore = createToastStore();
<script lang="ts">
    import { toastStore } from '../stores/toastStore';
    
    let toasts = $derived($toastStore);
</script>

<div class="toast-container">
    {#each toasts as toast (toast.id)}
        <div class="toast" class:error={toast.type === 'error'} class:info={toast.type === 'info'}>
            {toast.message}
        </div>
    {/each}
</div>

<style>
    .toast-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .toast {
        padding: 12px 24px;
        border-radius: 6px;
        background: #333;
        color: white;
        animation: slideIn 0.3s ease-out;
        min-width: 200px;
    }

    .toast.error {
        background: #dc3545;
    }

    .toast.info {
        background: #0d6efd;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
</style>
<script lang="ts">
    export let isOpen = false;
    export let title = '';
    export let onConfirm: () => void;
    export let onClose: () => void;
</script>

{#if isOpen}
 <!-- svelte-ignore a11y-click-events-have-key-events -->
 <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal-backdrop" onclick={onClose}>
        <div class="modal" onclick={(e) => e.stopPropagation()}>
            <h3>商品の削除</h3>
            <p>「{title}」を削除してもよろしいですか？</p>
            <div class="actions">
                <button class="cancel-button" onclick={onClose}>キャンセル</button>
                <button class="delete-button" onclick={() => {
                    onConfirm();
                    onClose();
                }}>削除</button>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        max-width: 400px;
        width: 90%;
    }

    .modal h3 {
        margin: 0 0 1rem 0;
    }

    .actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 1.5rem;
    }

    button {
        padding: 0.5rem 1rem;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        font-weight: 500;
    }

    .cancel-button {
        background: #e9ecef;
        color: #495057;
    }

    .cancel-button:hover {
        background: #dee2e6;
    }

    .delete-button {
        background: #dc3545;
        color: white;
    }

    .delete-button:hover {
        background: #c82333;
    }
</style>
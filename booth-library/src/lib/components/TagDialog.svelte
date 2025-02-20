<script lang="ts">
    import { productStore, type Product } from '../stores/productStore';
    let { product, onClose, availableTags } = $props<{
        product: Product;
        onClose: () => void;
        availableTags: string[];
    }>();
    let newTag = $state('');

    // 現在の商品に追加されていないタグをフィルタリング
    let availableNewTags = $derived(
        availableTags.filter((tag: string) => !product.tags.includes(tag))
    );

    function addTag(tagToAdd: string = newTag) {
        if (!tagToAdd || tagToAdd.length > 10 || product.tags.length >= 5) return;
        
        productStore.update(store => ({
            ...store,
            items: store.items.map(item => 
                item.title === product.title
                    ? { ...item, tags: [...item.tags, tagToAdd] }
                    : item
            )
        }));
        newTag = '';
    }

    function removeTag(tagToRemove: string) {
        productStore.update(store => ({
            ...store,
            items: store.items.map(item => 
                item.title === product.title
                    ? { ...item, tags: item.tags.filter(tag => tag !== tagToRemove) }
                    : item
            )
        }));
    }

    function handleOverlayClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }
</script>

<div class="dialog-overlay" onclick={handleOverlayClick}>
    <div class="dialog-content">
        <h3>{product.title} - タグ管理</h3>
        
        <div class="current-tags">
            <h4>現在のタグ:</h4>
            {#each product.tags as tag}
                <button class="tag" onclick={() => removeTag(tag)}>
                    {tag} ×
                </button>
            {/each}
        </div>

        {#if availableNewTags.length > 0}
            <div class="available-tags">
                <h4>利用可能なタグ:</h4>
                <div class="tag-list">
                    {#each availableNewTags as tag}
                        <button 
                            class="tag available"
                            onclick={() => addTag(tag)}
                            disabled={product.tags.length >= 5}
                        >
                            {tag} +
                        </button>
                    {/each}
                </div>
            </div>
        {/if}

        <div class="new-tag-form">
            <input 
                type="text" 
                bind:value={newTag}
                maxlength="10"
                placeholder="新しいタグ (10文字まで)"
            />
            <button 
                onclick={() => addTag()}
                disabled={!newTag || newTag.length > 10 || product.tags.length >= 5}
            >
                追加
            </button>
        </div>
        <button class="close-button" onclick={onClose}>閉じる</button>
    </div>
</div>

<style>
    .dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .dialog-content {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        min-width: 300px;
    }

    .current-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin: 1rem 0;
    }

    .tag {
        background: #e9ecef;
        border: none;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        cursor: pointer;
    }

    .new-tag-form {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .new-tag-form input {
        flex: 1;
        padding: 0.5rem;
    }

    .close-button {
        width: 100%;
        padding: 0.5rem;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .available-tags {
        margin: 1rem 0;
    }
    .tag-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }
    .tag.available {
        background: #e2e8f0;
    }
    .tag.available:hover {
        background: #cbd5e1;
    }
    h4 {
        margin: 0.5rem 0;
        font-size: 0.9rem;
        color: #4b5563;
    }
</style>
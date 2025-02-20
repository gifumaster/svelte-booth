<script lang="ts">
    import { productStore, tagMasterStore, removeFromTagMaster, type Product } from '../stores/productStore';
    import { toastStore } from '../stores/toastStore';
    import TagDialog from './TagDialog.svelte';
    import DeleteConfirmDialog from './DeleteConfirmDialog.svelte';
    import Toast from './Toast.svelte';
    import JsonUploader from './JsonUploader.svelte';
    import { LinkIcon, TagIcon, PlusCircleIcon, TrashIcon } from 'lucide-svelte';

    let selectedProduct = $state<Product | null>(null);
    let isJsonDialogOpen = $state(false);
    let searchQuery = $state("");
    let { items, selectedTags } = $derived($productStore);
    let masterTags = $derived($tagMasterStore);

    // Filter products based on selected tags and search query
    let filteredProducts = $derived(
        items.filter(item => {
            const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => item.tags.includes(tag));
            const matchesSearch = searchQuery === "" || item.title.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTags && matchesSearch;
        })
    );

    let productToDelete = $state<Product | null>(null);

    function toggleTag(tag: string) {
        productStore.update(store => ({
            ...store,
            selectedTags: store.selectedTags.includes(tag)
                ? store.selectedTags.filter(t => t !== tag)
                : [...store.selectedTags, tag]
        }));
    }

    function handleContextMenu(event: MouseEvent, tag: string) {
        event.preventDefault();
        if (removeFromTagMaster(tag)) {
            // タグが削除された場合、選択中のタグからも削除
            productStore.update(store => ({
                ...store,
                selectedTags: store.selectedTags.filter(t => t !== tag)
            }));
        } else {
            toastStore.show('このタグは商品で使用されているため削除できません。', 'error');
        }
    }

    function handleProductContextMenu(event: MouseEvent, product: Product) {
        event.preventDefault();
        selectedProduct = product;
    }

    function handleDelete(product: Product) {
        productToDelete = product;
    }

    function confirmDelete() {
        if (productToDelete) {
            productStore.deleteProduct(productToDelete.url);
            toastStore.show('商品を削除しました', 'success');
            productToDelete = null;
        }
    }
</script>

<Toast />

<div class="container">
    <div class="header">
        <div class="filters">
            <div class="search-box">
                <input
                    type="text"
                    placeholder="商品名で検索..."
                    bind:value={searchQuery}
                    class="search-input"
                />
            </div>
            <div class="tag-filter">
                <h3>タグフィルター</h3>
                <div class="tag-list">
                    {#each masterTags as tag}
                        <button 
                            class="tag"
                            class:selected={selectedTags.includes(tag)}
                            onclick={() => toggleTag(tag)}
                            oncontextmenu={(e) => handleContextMenu(e, tag)}
                            title="右クリックでタグを削除"
                        >
                            {tag}
                        </button>
                    {/each}
                </div>
            </div>
        </div>
        <button 
            class="add-button" 
            onclick={() => isJsonDialogOpen = true}
            title="商品データを追加"
        >
            <PlusCircleIcon size={24} />
        </button>
    </div>

    <div class="product-grid">
        {#each filteredProducts as product}
            <div 
                class="product-card"
            >
                <div class="image-container">
                    <img src={product.imageUrl} alt={product.title} loading="lazy" />
                    <div class="top-actions">
                        <button
                            class="icon-button delete-button"
                            title="商品を削除"
                            onclick={() => handleDelete(product)}
                        >
                            <TrashIcon size={18} />
                        </button>
                    </div>
                    <div class="bottom-actions">
                        <button 
                            class="icon-button" 
                            title="タグを編集"
                            onclick={() => selectedProduct = product}
                        >
                            <TagIcon size={18} />
                        </button>
                        <a 
                            href={product.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            class="icon-button" 
                            title="商品ページへ"
                        >
                            <LinkIcon size={18} />
                        </a>
                    </div>
                </div>
                <div class="title-actions">
                    <h4>{product.title}</h4>
                </div>
                <div class="product-tags">
                    {#each product.tags as tag}
                        <span class="tag">{tag}</span>
                    {/each}
                </div>
            </div>
        {/each}
    </div>

    <JsonUploader 
        isOpen={isJsonDialogOpen}
        onClose={() => isJsonDialogOpen = false}
    />
    
    {#if selectedProduct}
        <TagDialog 
            product={selectedProduct}
            onClose={() => selectedProduct = null}
        />
    {/if}

    <DeleteConfirmDialog 
        isOpen={!!productToDelete}
        title={productToDelete?.title ?? ''}
        onConfirm={confirmDelete}
        onClose={() => productToDelete = null}
    />
</div>

<style>
    .container {
        padding: 2rem;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
    }

    .add-button {
        background: none;
        border: none;
        color: #0d6efd;
        cursor: pointer;
        padding: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
    }

    .add-button:hover {
        transform: scale(1.1);
    }

    .filters {
        flex: 1;
    }

    .search-box {
        margin-bottom: 1rem;
    }

    .search-input {
        width: 100%;
        max-width: 300px;
        padding: 0.5rem;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        font-size: 1rem;
    }

    .search-input:focus {
        outline: none;
        border-color: #0d6efd;
        box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.25);
    }

    .tag-filter {
        margin-bottom: 2rem;
    }

    .tag-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .tag {
        background: #e9ecef;
        border: none;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        cursor: pointer;
    }

    .tag.selected {
        background: #0d6efd;
        color: white;
    }

    .product-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 1rem;
    }

    .product-card {
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        position: relative;
    }

    .image-container {
        position: relative;
        width: 100%;
    }

    .product-card img {
        width: 100%;
        aspect-ratio: 1;
        height: 140px;
        object-fit: cover;
        border-radius: 4px;
    }

    .top-actions {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        background: rgba(255, 255, 255, 0.4);
        padding: 0.25rem;
        border-radius: 4px;
        display: flex;
        gap: 0.25rem;
        z-index: 1;
        opacity: 0;
        transition: opacity 0.2s;
    }

    .bottom-actions {
        position: absolute;
        bottom: 0.75rem;
        right: 0.75rem;
        background: rgba(255, 255, 255, 0.4);
        padding: 0.25rem;
        border-radius: 4px;
        display: flex;
        gap: 0.25rem;
        z-index: 1;
        opacity: 0;
        transition: opacity 0.2s;
    }

    .product-card:hover .top-actions,
    .product-card:hover .bottom-actions {
        opacity: 1;
    }

    .title-actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .title-actions h4 {
        margin: 0;
        flex: 1;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        min-height: 2.5em;
        font-size: 0.9rem;
        line-height: 1.25;
    }

    .icon-button {
        color: rgba(13, 110, 253, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.35rem;
        border-radius: 4px;
        transition: all 0.2s;
        border: none;
        background: rgba(255, 255, 255, 0.4);
        cursor: pointer;
        backdrop-filter: blur(1px);
    }

    .icon-button:hover {
        background-color: rgba(255, 255, 255, 0.95);
        transform: scale(1.1);
        color: #0d6efd;
    }

    .delete-button {
        color: rgba(220, 53, 69, 0.8);
    }

    .delete-button:hover {
        color: rgb(220, 53, 69);
        background-color: rgba(255, 255, 255, 0.95);
    }

    .product-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        font-size: 0.8rem;
    }

    .product-tags .tag {
        background: #f8f9fa;
        color: #6c757d;
        padding: 0.15rem 0.4rem;
        border-radius: 12px;
        cursor: default;
        border: 1px solid #dee2e6;
        font-size: 0.75rem;
    }
</style>
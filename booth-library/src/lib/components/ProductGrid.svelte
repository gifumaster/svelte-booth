<script lang="ts">
    import { productStore, type Product } from '../stores/productStore';
    import TagDialog from './TagDialog.svelte';
    import { Link2, Tag } from 'lucide-svelte';

    let selectedProduct = $state<Product | null>(null);
    let { items, selectedTags } = $derived($productStore);

    // Get all unique tags from all products
    let allTags = $derived(
        Array.from(new Set(items.flatMap(item => item.tags)))
    );

    // Filter products based on selected tags
    let filteredProducts = $derived(
        selectedTags.length === 0
            ? items
            : items.filter(item =>
                selectedTags.every(tag => item.tags.includes(tag))
            )
    );

    function toggleTag(tag: string) {
        productStore.update(store => ({
            ...store,
            selectedTags: store.selectedTags.includes(tag)
                ? store.selectedTags.filter(t => t !== tag)
                : [...store.selectedTags, tag]
        }));
    }

    function handleContextMenu(event: MouseEvent, product: Product) {
        event.preventDefault();
        selectedProduct = product;
    }
</script>

<div class="container">
    <div class="tag-filter">
        <h3>タグフィルター</h3>
        <div class="tag-list">
            {#each allTags as tag}
                <button 
                    class="tag"
                    class:selected={selectedTags.includes(tag)}
                    onclick={() => toggleTag(tag)}
                >
                    {tag}
                </button>
            {/each}
        </div>
    </div>

    <div class="product-grid">
        {#each filteredProducts as product}
            <div 
                class="product-card"
                oncontextmenu={(e) => handleContextMenu(e, product)}
            >
                <img src={product.imgUrl} alt={product.title} />
                <div class="title-actions">
                    <h4>{product.title}</h4>
                    <div class="action-icons">
                        <button 
                            class="icon-button" 
                            title="タグを編集"
                            onclick={() => selectedProduct = product}
                        >
                            <Tag size={18} />
                        </button>
                        <a 
                            href={product.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            class="icon-button" 
                            title="商品ページへ"
                        >
                            <Link2 size={18} />
                        </a>
                    </div>
                </div>
                <div class="product-tags">
                    {#each product.tags as tag}
                        <span class="tag">{tag}</span>
                    {/each}
                </div>
            </div>
        {/each}
    </div>

    {#if selectedProduct}
        <TagDialog 
            product={selectedProduct}
            onClose={() => selectedProduct = null}
            availableTags={allTags}
        />
    {/if}
</div>

<style>
    .container {
        padding: 2rem;
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
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 1rem;
    }

    .product-card {
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .product-card img {
        width: 100%;
        height: 160px;
        object-fit: cover;
        border-radius: 4px;
    }

    .title-actions {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.5rem;
    }

    .title-actions h4 {
        margin: 0;
        flex: 1;
    }

    .action-icons {
        display: flex;
        gap: 0.25rem;
    }

    .icon-button {
        color: #0d6efd;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.25rem;
        border-radius: 4px;
        transition: background-color 0.2s;
        border: none;
        background: none;
        cursor: pointer;
    }

    .icon-button:hover {
        background-color: rgba(13, 110, 253, 0.1);
    }

    .product-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
    }
</style>
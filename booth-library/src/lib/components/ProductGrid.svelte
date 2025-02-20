<script lang="ts">
    import { productStore, type Product } from '../stores/productStore';
    import TagDialog from './TagDialog.svelte';

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
                <h4>{product.title}</h4>
                <div class="product-tags">
                    {#each product.tags as tag}
                        <span class="tag">{tag}</span>
                    {/each}
                </div>
                <a href={product.url} target="_blank" rel="noopener noreferrer">
                    商品ページへ
                </a>
            </div>
        {/each}
    </div>

    {#if selectedProduct}
        <TagDialog 
            product={selectedProduct}
            onClose={() => selectedProduct = null}
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
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 2rem;
    }

    .product-card {
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .product-card img {
        width: 100%;
        height: 200px;
        object-fit: cover;
        border-radius: 4px;
    }

    .product-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
    }

    .product-card a {
        display: block;
        text-align: center;
        padding: 0.5rem;
        background: #0d6efd;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        margin-top: auto;
    }
</style>
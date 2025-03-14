<script lang="ts">
    import { productStore, tagMasterStore, removeFromTagMaster, type Product } from '../stores/productStore';
    import { toastStore } from '../stores/toastStore';
    import TagDialog from './TagDialog.svelte';
    import DeleteConfirmDialog from './DeleteConfirmDialog.svelte';
    import Toast from './Toast.svelte';
    import JsonUploader from './JsonUploader.svelte';
    import { LinkIcon, TagIcon, PlusCircleIcon, TrashIcon, CheckSquareIcon, Square, XCircleIcon, StoreIcon, ChevronLeftIcon, ChevronRightIcon, ListIcon } from 'lucide-svelte';
    import ShopListDialog from './ShopListDialog.svelte';
    import SplashScreen from './SplashScreen.svelte';
    import { onMount } from 'svelte';

    let selectedProduct = $state<Product | null>(null);
    let isJsonDialogOpen = $state(false);
    let isShopListOpen = $state(false);
    let searchQuery = $state("");
    let gridColumns = $state(6); // 1行あたりの表示数（デフォルト6列）
    let { items, selectedTags, currentPage, pageSize } = $derived($productStore);
    let masterTags = $derived($tagMasterStore);
    let isLoading = $state(true);
    
    onMount(() => {
        // データ読み込み完了を模擬して少し遅延後にローディング状態を解除
        const timer = setTimeout(() => {
            isLoading = false;
        }, 1500);
        
        return () => {
            clearTimeout(timer);
        }
    });

    // Filter products based on selected tags and search query
    let filteredProducts = $derived(
        items.filter(item => {
            // 「非表示」タグが付いている商品は、「非表示」タグが選択されている場合のみ表示
            const isHidden = selectedTags.includes('非表示');
            if (item.tags.includes('非表示') && !isHidden) {
                return false
            }

            // 通常のタグフィルタリング
            const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => item.tags.includes(tag));
            const matchesSearch = searchQuery === "" || 
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.shop && item.shop.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesTags && matchesSearch;
        })
    );

    // ページネーション用の計算
    let totalPages = $derived(Math.ceil(filteredProducts.length / pageSize));
    let currentPageProducts = $derived(
        filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    );

    function goToPage(page: number) {
        if (page >= 1 && page <= totalPages) {
            productStore.update(store => ({
                ...store,
                currentPage: page
            }));
        }
    }

    const pageSizeOptions = [20, 100, 500];
    const gridColumnOptions = [3, 4, 6, 8];

    function changePageSize(size: number) {
        productStore.setPageSize(size);
    }

    function changeGridColumns(columns: number) {
        gridColumns = columns;
    }

    let productToDelete = $state<Product | null>(null);

    function toggleTag(tag: string) {
        productStore.update(store => ({
            ...store,
            selectedTags: store.selectedTags.includes(tag)
                ? store.selectedTags.filter(t => t !== tag)
                : [...store.selectedTags, tag],
            currentPage: 1  // タグ切り替え時にページを1に戻す
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

    // 複数選択モード用の状態
    let isBulkSelectMode = $state(false);
    let selectedProducts = $state<Set<string>>(new Set());

    function toggleBulkSelectMode() {
        isBulkSelectMode = !isBulkSelectMode;
        if (!isBulkSelectMode) {
            selectedProducts = new Set();
        } else {
            toastStore.show('商品を選択した後、タグをクリックすることで一括追加できます', 'info');
        }
    }

    function toggleProductSelection(product: Product) {
        const newSet = new Set(selectedProducts);
        if (newSet.has(product.url)) {
            newSet.delete(product.url);
        } else {
            newSet.add(product.url);
        }
        selectedProducts = newSet;
    }

    function addTagToBulkProducts(tag: string) {
        const updatedItems = items.map(product => {
            if (selectedProducts.has(product.url) && !product.tags.includes(tag)) {
                return {
                    ...product,
                    tags: [...product.tags, tag]
                };
            }
            return product;
        });

        productStore.update(store => ({
            ...store,
            items: updatedItems
        }));

        // 選択状態をリセット
        selectedProducts = new Set();
        isBulkSelectMode = false;

        toastStore.show(`選択した商品に「${tag}」を追加しました`, 'success');
    }

    let gridColumnsValue = $derived(gridColumns.toString());
    $effect(() => {
        document.documentElement.style.setProperty('--grid-columns-value', gridColumnsValue);
    });
</script>

<Toast />
<SplashScreen isVisible={isLoading} />

<div class="container">
    <div class="header">
        <div class="filters">
            <div class="search-box">
                <div class="search-actions-container">
                    <div class="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="商品名またはショップ名で検索..."
                            bind:value={searchQuery}
                            class="search-input"
                        />
                        <div class="search-actions">
                            {#if searchQuery}
                                <button 
                                    class="clear-button" 
                                    onclick={() => searchQuery = ""}
                                    title="検索をクリア"
                                >
                                    <XCircleIcon size={16} />
                                </button>
                            {/if}
                            <button 
                                class="shop-list-button" 
                                onclick={() => isShopListOpen = true}
                                title="ショップ一覧を表示"
                            >
                                <StoreIcon size={16} />
                            </button>
                        </div>
                    </div>
                    <div class="page-controls">
                        <div class="pagination">
                            <button 
                                class="page-button" 
                                disabled={currentPage === 1}
                                onclick={() => goToPage(currentPage - 1)}
                            >
                                <ChevronLeftIcon size={20} />
                            </button>
                            <span class="page-info">
                                {currentPage} / {totalPages}
                            </span>
                            <button 
                                class="page-button" 
                                disabled={currentPage === totalPages}
                                onclick={() => goToPage(currentPage + 1)}
                            >
                                <ChevronRightIcon size={20} />
                            </button>
                        </div>
                        <div class="page-size-selector">
                            <ListIcon size={16} />
                            <select 
                                value={pageSize} 
                                onchange={e => changePageSize(Number(e.currentTarget.value))}
                                title="1ページあたりの表示件数"
                            >
                                {#each pageSizeOptions as size}
                                    <option value={size}>{size}件</option>
                                {/each}
                            </select>
                        </div>
                        <div class="grid-columns-selector">
                            <select 
                                value={gridColumns} 
                                onchange={e => changeGridColumns(Number(e.currentTarget.value))}
                                title="1行あたりの表示数"
                            >
                                {#each gridColumnOptions as columns}
                                    <option value={columns}>{columns}列</option>
                                {/each}
                            </select>
                        </div>
                    </div>
                </div>
                <span class="product-count">
                    {items.length}件中{filteredProducts.length}件表示中 ({(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredProducts.length)}件)
                </span>
            </div>
            <div class="tag-filter">
                <div class="tag-header">
                    <h3>タグフィルター</h3>
                    <button 
                        class="bulk-select-button"
                        onclick={toggleBulkSelectMode}
                        class:active={isBulkSelectMode}
                        disabled={masterTags.length === 0}
                        title={masterTags.length === 0 ? "タグマスターが空のため使用できません" : "商品の複数選択モード"}
                    >
                        <CheckSquareIcon size={20} />
                    </button>
                </div>
                <div class="tag-list">
                    {#each masterTags.filter(tag => tag !== '非表示') as tag}
                        <button 
                            class="tag"
                            class:selected={selectedTags.includes(tag)}
                            onclick={() => isBulkSelectMode && selectedProducts.size > 0 ? addTagToBulkProducts(tag) : toggleTag(tag)}
                            oncontextmenu={(e) => handleContextMenu(e, tag)}
                            title={isBulkSelectMode && selectedProducts.size > 0 ? "クリックで選択した商品にタグを追加" : "右クリックでタグを削除"}
                        >
                            {tag}
                        </button>
                    {/each}
                    {#if masterTags.includes('非表示')}
                        <button 
                            class="tag"
                            class:selected={selectedTags.includes('非表示')}
                            onclick={() => isBulkSelectMode && selectedProducts.size > 0 ? addTagToBulkProducts('非表示') : toggleTag('非表示')}
                            oncontextmenu={(e) => handleContextMenu(e, '非表示')}
                            title={isBulkSelectMode && selectedProducts.size > 0 ? "クリックで選択した商品にタグを追加" : "右クリックでタグを削除"}
                        >
                            非表示
                        </button>
                    {/if}
                </div>
            </div>
        </div>
        <button 
            class="add-button" 
            onclick={() => isJsonDialogOpen = true}
            title="商品データを追加"
        >
            <PlusCircleIcon size={24} />
            ライブラリに追加
        </button>
    </div>

    <div class="product-grid">
        {#each currentPageProducts as product}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->        
            <div 
                class="product-card"
                class:selected={selectedProducts.has(product.url)}
                class:selecting={isBulkSelectMode}
                onclick={() => isBulkSelectMode ? toggleProductSelection(product) : null}
            >
                <div class="image-container">
                    <img src={product.imageUrl} alt={product.title} loading="lazy" />
                    {#if isBulkSelectMode}
                        <div class="checkbox-container">
                            {#if selectedProducts.has(product.url)}
                                <CheckSquareIcon size={20} style="color: #0d6efd;" />
                            {:else}
                                <Square size={20} style="color: #6c757d;" />
                            {/if}
                        </div>
                    {/if}
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
                    {#if product.shop}
                        <span class="shop-name">{product.shop}</span>
                    {/if}
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

    <ShopListDialog
        isOpen={isShopListOpen}
        onClose={() => isShopListOpen = false}
        products={items}
        onShopSelect={(shop) => searchQuery = shop}
    />
</div>

<style>
    .container {
        padding: 2rem;
    }

    .header {
        position: sticky;
        top: 0;
        z-index: 10;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(8px);
        padding: 1rem;
        margin: -2rem -2rem 1rem -2rem;
        box-shadow: 0 4px 12px -8px rgba(0, 0, 0, 0.15);
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 1px solid rgba(222, 226, 230, 0.6);
        transition: box-shadow 0.3s ease;
    }

    .header:hover {
        box-shadow: 0 4px 16px -6px rgba(0, 0, 0, 0.2);
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

    .search-actions-container {
        display: flex;
        gap: 1rem;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .search-input-wrapper {
        position: relative;
        width: 300px;
    }

    .search-actions {
        position: absolute;
        right: 0.5rem;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .search-input {
        width: 100%;
        max-width: 300px;
        padding: 0.5rem;
        padding-right: 4rem;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        font-size: 1rem;
    }

    .clear-button {
        background: none;
        border: none;
        color: #6c757d;
        cursor: pointer;
        padding: 0.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s;
    }

    .clear-button:hover {
        color: #dc3545;
    }

    .shop-list-button {
        background: none;
        border: none;
        color: #6c757d;
        cursor: pointer;
        padding: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s;
    }

    .shop-list-button:hover {
        color: #0d6efd;
        background-color: #e9ecef;
    }

    .search-input:focus {
        outline: none;
        border-color: #0d6efd;
        box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.25);
    }

    .product-count {
        margin-bottom: 1rem;
        color: #6c757d;
        font-size: 0.9rem;
    }

    .tag-filter {
        margin-bottom: 2rem;
    }

    .tag-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 0.5rem;
    }

    .bulk-select-button {
        background: none;
        border: none;
        color: #6c757d;
        cursor: pointer;
        padding: 0.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s;
    }

    .bulk-select-button:hover {
        background-color: #e9ecef;
    }

    .bulk-select-button.active {
        color: #0d6efd;
        background-color: #e7f1ff;
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
        grid-template-columns: repeat(var(--grid-columns), minmax(100px, 1fr));
        gap: 1rem;
        --grid-columns: var(--grid-columns-value, 6);
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

    .product-card.selected {
        border-color: #0d6efd;
        box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.25);
    }

    .product-card.selecting {
        cursor: pointer;
    }

    .product-card.selecting:hover {
        border-color: #0d6efd;
        box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.25);
    }

    .image-container {
        position: relative;
        width: 100%;
    }

    .product-card img {
        width: 100%;
        aspect-ratio: 1;
        height: calc(140px * (6 / var(--grid-columns))); /* 列数に応じて画像サイズを調整 */
        object-fit: contain;
        border-radius: 4px;
        background:
    repeating-linear-gradient(
        45deg,
        #f8f9fa,
        #f8f9fa 5px,
        #e9ecef 5px,
        #e9ecef 10px
    ),
    radial-gradient(circle at center,
        rgba(248, 249, 250, 0.8) 0%,
        rgba(233, 236, 239, 0.8) 100%
    );
    }

    .checkbox-container {
        position: absolute;
        top: 0.75rem;
        left: 0.75rem;
        z-index: 1;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 4px;
        padding: 0.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
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

    .shop-name {
        font-size: 0.8rem;
        color: #6c757d;
        margin-top: 0.25rem;
    }

    .pagination {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .page-button {
        background: none;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        padding: 0.35rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
    }

    .page-button:hover:not(:disabled) {
        background: #e9ecef;
        border-color: #adb5bd;
    }

    .page-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .page-info {
        font-size: 0.9rem;
        color: #6c757d;
        min-width: 4rem;
        text-align: center;
    }

    .page-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .page-size-selector {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #6c757d;
        font-size: 0.9rem;
    }

    .page-size-selector select {
        padding: 0.35rem;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        background: white;
        color: #6c757d;
        font-size: 0.9rem;
        cursor: pointer;
    }

    .page-size-selector select:hover {
        border-color: #adb5bd;
    }

    .page-size-selector select:focus {
        outline: none;
        border-color: #0d6efd;
        box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.25);
    }

    .grid-columns-selector {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #6c757d;
        font-size: 0.9rem;
    }

    .grid-columns-selector select {
        padding: 0.35rem;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        background: white;
        color: #6c757d;
        font-size: 0.9rem;
        cursor: pointer;
    }

    .grid-columns-selector select:hover {
        border-color: #adb5bd;
    }

    .grid-columns-selector select:focus {
        outline: none;
        border-color: #0d6efd;
        box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.25);
    }

    .action-buttons {
        display: flex;
        gap: 1rem;
        align-items: center;
    }
</style>
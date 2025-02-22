<script lang="ts">
    import type { Product } from '../stores/productStore';
    import { XIcon, SearchIcon, ArrowUpDownIcon } from 'lucide-svelte';

    const { isOpen, onClose, products, onShopSelect } = $props<{
        isOpen: boolean;
        onClose: () => void;
        products: Product[];
        onShopSelect: (shop: string) => void;
    }>();

    const SHOP_SORT_KEY = 'booth-library-shop-sort';

    // ローカルストレージからソート設定を読み込む
    const savedSort = typeof window !== 'undefined' ? localStorage.getItem(SHOP_SORT_KEY) : null;
    const initialSort = savedSort ? JSON.parse(savedSort) : { type: 'name', order: 'asc' };

    type SortType = 'name' | 'count';
    type SortOrder = 'asc' | 'desc';
    let sortType = $state<SortType>(initialSort.type);
    let sortOrder = $state<SortOrder>(initialSort.order);

    // ソート設定が変更されたときにローカルストレージに保存
    $effect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(SHOP_SORT_KEY, JSON.stringify({ type: sortType, order: sortOrder }));
        }
    });

    let shopCounts = $derived(products.reduce((acc: Map<string, number>, product: Product) => {
        if (product.shop) {
            acc.set(product.shop, (acc.get(product.shop) || 0) + 1);
        }
        return acc;
    }, new Map<string, number>()));

    let uniqueShops = $derived([...new Set(products
        .filter((p: Product) => p.shop)
        .map((p: Product) => p.shop!)
    )] as string[]);

    let sortedShops = $derived(
        [...uniqueShops].sort((a, b) => {
            if (sortType === 'name') {
                return sortOrder === 'asc' 
                    ? a.localeCompare(b)
                    : b.localeCompare(a);
            } else {
                const countA = shopCounts.get(a) || 0;
                const countB = shopCounts.get(b) || 0;
                return sortOrder === 'asc'
                    ? countA - countB
                    : countB - countA;
            }
        })
    );

    function toggleSort(type: SortType) {
        if (sortType === type) {
            sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            sortType = type;
            sortOrder = 'asc';
        }
    }

    function handleOverlayClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            onClose();
        }
    }

    function handleShopClick(shop: string) {
        onShopSelect(shop);
        onClose();
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="overlay" onclick={handleOverlayClick}>
        <div class="dialog">
            <div class="dialog-header">
                <h2>ショップ一覧</h2>
                <button class="close-button" onclick={onClose} title="閉じる">
                    <XIcon size={20} />
                </button>
            </div>
            <div class="dialog-content">
                {#if sortedShops.length > 0}
                    <div class="sort-buttons">
                        <button 
                            class="sort-button" 
                            class:active={sortType === 'name'}
                            onclick={() => toggleSort('name')}
                        >
                            ショップ名
                            <ArrowUpDownIcon size={14} style="opacity: {sortType === 'name' ? 1 : 0.3};" />
                            {#if sortType === 'name'}
                                <span class="sort-order">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            {/if}
                        </button>
                        <button 
                            class="sort-button" 
                            class:active={sortType === 'count'}
                            onclick={() => toggleSort('count')}
                        >
                            購入点数
                            <ArrowUpDownIcon size={14} style="opacity: {sortType === 'count' ? 1 : 0.3};" />
                            {#if sortType === 'count'}
                                <span class="sort-order">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            {/if}
                        </button>
                    </div>
                    <div class="shop-list">
                        {#each sortedShops as shop (shop)}
                            <button 
                                class="shop-item"
                                onclick={() => handleShopClick(shop)}
                            >
                                <div class="shop-info">
                                    {shop}
                                    <span class="count">
                                        {shopCounts.get(shop)}点
                                    </span>
                                </div>
                                <SearchIcon 
                                    size={16} 
                                    style="color: #6c757d; opacity: 0.5; transition: all 0.2s;"
                                />
                            </button>
                        {/each}
                    </div>
                {:else}
                    <p class="no-shops">ショップ情報がありません</p>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .overlay {
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

    .dialog {
        background: white;
        border-radius: 8px;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
    }

    .dialog-header {
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #dee2e6;
    }

    .dialog-header h2 {
        margin: 0;
        font-size: 1.25rem;
    }

    .close-button {
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

    .close-button:hover {
        background-color: #e9ecef;
        color: #000;
    }

    .dialog-content {
        padding: 1rem;
        overflow-y: auto;
    }

    .shop-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .shop-item {
        padding: 0.75rem 1rem;
        background: #f8f9fa;
        border-radius: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        border: none;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .shop-item:hover {
        background: #e9ecef;
    }

    .shop-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex: 1;
        margin-right: 1rem;
    }

    .count {
        font-size: 0.875rem;
        color: #6c757d;
    }

    .no-shops {
        text-align: center;
        color: #6c757d;
        margin: 2rem 0;
    }

    .shop-item:hover :global(svg) {
        color: #0d6efd !important;
        opacity: 1 !important;
    }

    .sort-buttons {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .sort-button {
        padding: 0.5rem 0.75rem;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #6c757d;
        transition: all 0.2s;
    }

    .sort-button:hover {
        background: #e9ecef;
        border-color: #ced4da;
    }

    .sort-button.active {
        background: #e7f1ff;
        border-color: #0d6efd;
        color: #0d6efd;
    }

    .sort-order {
        font-size: 0.75rem;
        line-height: 1;
    }
</style>
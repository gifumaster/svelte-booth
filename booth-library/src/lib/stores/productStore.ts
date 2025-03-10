import { writable } from 'svelte/store';
import initData from '../init.json';

export interface Product {
    url: string;
    title: string;
    price?: number;
    imageUrl: string;
    tags: string[];
    shop?: string;
}

const STORAGE_KEY = 'booth-library-products';
const TAG_STORAGE_KEY = 'booth-library-tags';
const PAGE_SIZE_KEY = 'booth-library-page-size';

// タグのマスターデータを管理するストア
export const tagMasterStore = (() => {
    const { subscribe, set, update } = writable<string[]>([]);

    // 初期データをローカルストレージから読み込む
    const storedTags = typeof window !== 'undefined' ? localStorage.getItem(TAG_STORAGE_KEY) : null;
    if (storedTags) {
        set(JSON.parse(storedTags));
    }

    return {
        subscribe,
        update: (fn: (tags: string[]) => string[]) => {
            update(tags => {
                const newTags = fn(tags);
                if (typeof window !== 'undefined') {
                    localStorage.setItem(TAG_STORAGE_KEY, JSON.stringify(newTags));
                }
                return newTags;
            });
        }
    };
})();

// プロダクトを管理するストア
export const productStore = (() => {
    // 保存されたページサイズを読み込む
    const storedPageSize = typeof window !== 'undefined' ? localStorage.getItem(PAGE_SIZE_KEY) : null;
    const initialPageSize = storedPageSize ? parseInt(storedPageSize) : 100;

    const { subscribe, set, update } = writable<{
        items: Product[];
        selectedTags: string[];
        currentPage: number;
        pageSize: number;
    }>({
        items: [],
        selectedTags: [],
        currentPage: 1,
        pageSize: initialPageSize
    });

    if (typeof window !== 'undefined') {
        // タブがアクティブになったときにデータを再読み込み
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                const storedData = localStorage.getItem(STORAGE_KEY);
                if (storedData) {
                    try {
                        const items = JSON.parse(storedData) as Product[];
                        update(store => ({
                            ...store,
                            items
                        }));
                    } catch (error) {
                        console.error('Failed to load stored data on visibility change:', error);
                    }
                }

                const storedTags = localStorage.getItem(TAG_STORAGE_KEY);
                if (storedTags) {
                    try {
                        const tags = JSON.parse(storedTags) as string[];
                        tagMasterStore.update(() => tags);
                    } catch (error) {
                        console.error('Failed to load stored tags on visibility change:', error);
                    }
                }
            }
        });

        // 他のウィンドウでのLocalStorageの変更を検知
        window.addEventListener('storage', (event) => {
            if (event.key === STORAGE_KEY && event.newValue) {
                try {
                    const items = JSON.parse(event.newValue) as Product[];
                    update(store => ({
                        ...store,
                        items
                    }));
                } catch (error) {
                    console.error('Failed to sync data from storage event:', error);
                }
            } else if (event.key === TAG_STORAGE_KEY && event.newValue) {
                try {
                    const tags = JSON.parse(event.newValue) as string[];
                    tagMasterStore.update(() => tags);
                } catch (error) {
                    console.error('Failed to sync tags from storage event:', error);
                }
            } else if (event.key === PAGE_SIZE_KEY && event.newValue) {
                try {
                    const pageSize = parseInt(event.newValue);
                    update(store => ({
                        ...store,
                        pageSize,
                        currentPage: 1
                    }));
                } catch (error) {
                    console.error('Failed to sync page size from storage event:', error);
                }
            }
        });
    }

    return {
        subscribe,
        update: (fn: (store: { 
            items: Product[]; 
            selectedTags: string[]; 
            currentPage: number;
            pageSize: number;
        }) => { 
            items: Product[]; 
            selectedTags: string[];
            currentPage: number;
            pageSize: number;
        }) => {
            update(store => {
                const newStore = fn(store);
                if (typeof window !== 'undefined') {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStore.items));
                    if (store.pageSize !== newStore.pageSize) {
                        localStorage.setItem(PAGE_SIZE_KEY, newStore.pageSize.toString());
                    }
                }
                return newStore;
            });
        },
        setPageSize: (size: number) => {
            update(store => ({
                ...store,
                pageSize: size,
                currentPage: 1 // ページサイズが変更されたら1ページ目に戻す
            }));
        },
        addProducts: (newProducts: Product[]) => {
            update(store => {
                // 新しい商品と既存の商品をマージ
                const updatedItems = store.items.map(existingProduct => {
                    const newProduct = newProducts.find(p => p.url === existingProduct.url);
                    if (newProduct) {
                        return {
                            ...existingProduct,
                            title: newProduct.title,
                            imageUrl: newProduct.imageUrl,
                            shop: newProduct.shop || existingProduct.shop
                        };
                    }
                    return existingProduct;
                });

                // 完全に新しい商品（既存のURLを持たない商品）を追加
                const uniqueProducts = newProducts.filter(newProduct => 
                    !store.items.some(existingProduct => existingProduct.url === newProduct.url)
                );

                // 新しい商品のタグをタグマスターに追加
                uniqueProducts.forEach(product => {
                    product.tags.forEach(tag => addToTagMaster(tag));
                });

                const finalItems = [...uniqueProducts, ...updatedItems];
                
                if (typeof window !== 'undefined') {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalItems));
                }

                return {
                    ...store,
                    items: finalItems
                };
            });
        },
        deleteProduct: (url: string) => {
            update(store => {
                const productToDelete = store.items.find(item => item.url === url);
                if (!productToDelete) return store;

                const newItems = store.items.filter(item => item.url !== url);

                // 削除された商品のタグを他の商品が使用していない場合は、タグマスターからも削除
                productToDelete.tags.forEach(tag => {
                    const isTagUsed = newItems.some(item => item.tags.includes(tag));
                    if (!isTagUsed) {
                        removeFromTagMaster(tag);
                    }
                });

                if (typeof window !== 'undefined') {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
                }

                return {
                    ...store,
                    items: newItems
                };
            });
        },
        exportProducts: () => {
            let exportProducts: Product[] = [];
            update(store => {
                exportProducts = store.items;
                return store;
            });
            return JSON.stringify(exportProducts, null, 2);
        }
    };
})();

// タグマスターの操作関数
export function addToTagMaster(tag: string) {
    tagMasterStore.update(tags => {
        if (!tags.includes(tag)) {
            return [...tags, tag];
        }
        return tags;
    });
}

export function removeFromTagMaster(tag: string) {
    let isTagInUse = false;
    productStore.subscribe(store => {
        isTagInUse = store.items.some(item => item.tags.includes(tag));
    })();

    if (!isTagInUse) {
        tagMasterStore.update(tags => tags.filter(t => t !== tag));
        return true;
    }
    return false;
}

// Initialize store with stored or initial data
const loadInitialData = async () => {
    if (typeof window === 'undefined') return;

    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
        try {
            const items = JSON.parse(storedData) as Product[];
            productStore.update(store => ({
                ...store,
                items
            }));
            // タグマスターの更新
            items.forEach((item: Product) => {
                item.tags.forEach((tag: string) => addToTagMaster(tag));
            });
        } catch (error) {
            console.error('Failed to load stored data:', error);
        }
    } else {
        // LocalStorageにデータが存在しない場合、init.jsonから初期データを読み込む
        try {
            const items = initData.items as Product[];
            productStore.update(store => ({
                ...store,
                items
            }));
            // タグマスターの更新
            items.forEach((item: Product) => {
                item.tags.forEach((tag: string) => addToTagMaster(tag));
            });
            // 初期データをLocalStorageに保存
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    }
};

loadInitialData();
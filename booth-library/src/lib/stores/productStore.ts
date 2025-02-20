import { writable } from 'svelte/store';

export interface Product {
    url: string;
    title: string;
    price?: number;
    imageUrl: string;
    tags: string[];
}

const STORAGE_KEY = 'booth-library-products';
const TAG_STORAGE_KEY = 'booth-library-tags';

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
    const { subscribe, set, update } = writable<{
        items: Product[];
        selectedTags: string[];
    }>({
        items: [],
        selectedTags: []
    });

    return {
        subscribe,
        update: (fn: (store: { items: Product[]; selectedTags: string[] }) => { items: Product[]; selectedTags: string[] }) => {
            update(store => {
                const newStore = fn(store);
                if (typeof window !== 'undefined') {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStore.items));
                }
                return newStore;
            });
        },
        addProducts: (newProducts: Product[]) => {
            update(store => {
                // 既存のURLを持つ商品を除外
                const uniqueProducts = newProducts.filter(newProduct => 
                    !store.items.some(existingProduct => existingProduct.url === newProduct.url)
                );

                // 新しい商品のタグをタグマスターに追加
                uniqueProducts.forEach(product => {
                    product.tags.forEach(tag => addToTagMaster(tag));
                });

                const newItems = [...store.items, ...uniqueProducts];
                
                return {
                    ...store,
                    items: newItems
                };
            });
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
            return;
        } catch (error) {
            console.error('Failed to load stored data:', error);
        }
    }

    // ストアが空の場合のみ初期データを読み込む
    try {
        const response = await fetch('/src/lib/contents.json');
        const data = await response.json();
        
        const products = data.map((item: any) => ({
            ...item,
            tags: [] as string[]
        }));

        productStore.update(store => ({
            ...store,
            items: products
        }));
    } catch (error) {
        console.error('Failed to load initial data:', error);
    }
};

loadInitialData();
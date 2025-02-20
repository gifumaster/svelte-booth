import { writable } from 'svelte/store';

export interface Product {
    url: string;
    title: string;
    price: number;
    imageUrl: string;
    tags: string[];
}

// タグのマスターデータを管理するストア
export const tagMasterStore = writable<string[]>([]);

// プロダクトを管理するストア
export const productStore = writable<{
    items: Product[];
    selectedTags: string[];
}>({
    items: [],
    selectedTags: []
});

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

// Initialize store with contents.json data only if store is empty
const loadInitialData = async () => {
    let currentStore: ProductStore;
    productStore.subscribe(store => {
        currentStore = store;
    })();

    // Only load initial data if the store is empty
    if (currentStore.items.length === 0) {
        try {
            const response = await fetch('/src/lib/contents.json');
            const data = await response.json();
            productStore.update(store => ({
                ...store,
                items: data.items.map((item: Product) => ({
                    ...item,
                    tags: item.tags || []
                }))
            }));
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    }
};

loadInitialData();
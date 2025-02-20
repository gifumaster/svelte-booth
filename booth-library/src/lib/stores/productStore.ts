import { persisted } from 'svelte-local-storage-store';
import type { Writable } from 'svelte/store';

export interface Product {
    title: string;
    url: string;
    imgUrl: string;
    tags: string[];
}

interface ProductStore {
    items: Product[];
    selectedTags: string[];
}

export const productStore: Writable<ProductStore> = persisted('product-store', {
    items: [],
    selectedTags: []
});

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
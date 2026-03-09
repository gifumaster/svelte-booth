import { writable } from 'svelte/store';
import initData from '../init.json';
import {
	deleteProductsFromDb,
	getAllProductsFromDb,
	loadProductOrderFromDb,
	loadTagsFromDb,
	putProductsInDb,
	replaceProductsInDb,
	saveProductOrderToDb,
	saveTagsToDb
} from '../db/libraryDb';

export interface Product {
	url: string;
	title: string;
	price?: number;
	imageUrl: string;
	tags: string[];
	shop?: string;
}

type ProductState = {
	items: Product[];
	selectedTags: string[];
	currentPage: number;
	pageSize: number;
};

const LEGACY_STORAGE_KEY = 'booth-library-products';
const LEGACY_TAG_STORAGE_KEY = 'booth-library-tags';
const PAGE_SIZE_KEY = 'booth-library-page-size';
const SYNC_CHANNEL_NAME = 'booth-library-sync';

const initialPageSize = (() => {
	if (typeof window === 'undefined') {
		return 100;
	}

	const storedPageSize = localStorage.getItem(PAGE_SIZE_KEY);
	const parsed = storedPageSize ? Number.parseInt(storedPageSize, 10) : NaN;
	return Number.isFinite(parsed) ? parsed : 100;
})();

const syncChannel =
	typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(SYNC_CHANNEL_NAME) : null;

function deriveTagMaster(items: Product[]): string[] {
	return [...new Set(items.flatMap((item) => item.tags))];
}

function orderProducts(items: Product[], order: string[]): Product[] {
	if (order.length === 0) {
		return items;
	}

	const itemsByUrl = new Map(items.map((item) => [item.url, item]));
	const orderedItems: Product[] = [];

	for (const url of order) {
		const item = itemsByUrl.get(url);
		if (item) {
			orderedItems.push(item);
			itemsByUrl.delete(url);
		}
	}

	return [...orderedItems, ...itemsByUrl.values()];
}

function loadLegacyProducts(): Product[] {
	if (typeof window === 'undefined') {
		return [];
	}

	const storedData = localStorage.getItem(LEGACY_STORAGE_KEY);
	if (!storedData) {
		return [];
	}

	try {
		return JSON.parse(storedData) as Product[];
	} catch (error) {
		console.error('Failed to parse legacy product data:', error);
		return [];
	}
}

function loadLegacyTags(): string[] {
	if (typeof window === 'undefined') {
		return [];
	}

	const storedTags = localStorage.getItem(LEGACY_TAG_STORAGE_KEY);
	if (!storedTags) {
		return [];
	}

	try {
		return JSON.parse(storedTags) as string[];
	} catch (error) {
		console.error('Failed to parse legacy tag data:', error);
		return [];
	}
}

function productSignature(product: Product): string {
	return JSON.stringify(product);
}

function diffProducts(previousItems: Product[], nextItems: Product[]) {
	const previousByUrl = new Map(previousItems.map((item) => [item.url, item]));
	const nextByUrl = new Map(nextItems.map((item) => [item.url, item]));

	const upserts: Product[] = [];
	const deletions: string[] = [];

	for (const item of nextItems) {
		const previousItem = previousByUrl.get(item.url);
		if (!previousItem || productSignature(previousItem) !== productSignature(item)) {
			upserts.push(item);
		}
	}

	for (const item of previousItems) {
		if (!nextByUrl.has(item.url)) {
			deletions.push(item.url);
		}
	}

	return { upserts, deletions };
}

async function persistProducts(previousItems: Product[], nextItems: Product[]) {
	if (typeof window === 'undefined') {
		return;
	}

	const { upserts, deletions } = diffProducts(previousItems, nextItems);
	await Promise.all([
		putProductsInDb(upserts),
		deleteProductsFromDb(deletions),
		saveProductOrderToDb(nextItems.map((item) => item.url))
	]);
	syncChannel?.postMessage({ type: 'products-changed' });
}

async function persistTags(tags: string[]) {
	if (typeof window === 'undefined') {
		return;
	}

	await saveTagsToDb(tags);
	syncChannel?.postMessage({ type: 'tags-changed' });
}

const tagWritable = writable<string[]>([]);
const { subscribe: subscribeTags, set: setTags, update: updateTags } = tagWritable;

export const tagMasterStore = {
	subscribe: subscribeTags,
	update: (fn: (tags: string[]) => string[]) => {
		let nextTags: string[] | null = null;

		updateTags((tags) => {
			nextTags = fn(tags);
			return nextTags;
		});

		if (nextTags) {
			void persistTags(nextTags).catch((error) => {
				console.error('Failed to persist tags:', error);
			});
		}
	}
};

const productWritable = writable<ProductState>({
	items: [],
	selectedTags: [],
	currentPage: 1,
	pageSize: initialPageSize
});

const { subscribe: subscribeProducts, update: updateProducts } = productWritable;

function replaceItems(items: Product[]) {
	updateProducts((store) => ({
		...store,
		items
	}));
}

function syncPageSize(pageSize: number) {
	updateProducts((store) => ({
		...store,
		pageSize,
		currentPage: 1
	}));
}

let isInitialized = false;
let initializeStorePromise: Promise<void> | null = null;

function afterInitialization<T>(action: () => T | Promise<T>): Promise<T> {
	if (isInitialized) {
		return Promise.resolve(action());
	}

	return ensureInitialized().then(action).catch((error) => {
		console.error('Failed to wait for store initialization:', error);
		throw error;
	});
}

function applyProductUpdate(fn: (store: ProductState) => ProductState) {
	let previousStore!: ProductState;
	let nextStore!: ProductState;

	updateProducts((store) => {
		previousStore = store;
		nextStore = fn(store);
		return nextStore;
	});

	if (typeof window === 'undefined') {
		return;
	}

	if (previousStore.items !== nextStore.items) {
		void persistProducts(previousStore.items, nextStore.items).catch((error) => {
			console.error('Failed to persist products:', error);
		});
	}

	if (previousStore.pageSize !== nextStore.pageSize) {
		localStorage.setItem(PAGE_SIZE_KEY, nextStore.pageSize.toString());
	}
}

async function reloadFromDb() {
	try {
		const [items, tags, order] = await Promise.all([
			getAllProductsFromDb(),
			loadTagsFromDb(),
			loadProductOrderFromDb()
		]);
		const orderedItems = orderProducts(items, order);

		replaceItems(orderedItems);

		setTags(tags.length > 0 ? tags : deriveTagMaster(orderedItems));
	} catch (error) {
		console.error('Failed to reload IndexedDB data:', error);
	}
}

export const productStore = {
	subscribe: subscribeProducts,
	update: (fn: (store: ProductState) => ProductState) => {
		void afterInitialization(() => {
			applyProductUpdate(fn);
		});
	},
	setPageSize: (size: number) => {
		void afterInitialization(() => {
			applyProductUpdate((store) => ({
				...store,
				pageSize: size,
				currentPage: 1
			}));
		});
	},
	addProducts: (newProducts: Product[]) => {
		return afterInitialization(() => {
			const newTags = new Set<string>();

			applyProductUpdate((store) => {
				const updatedItems = store.items.map((existingProduct) => {
					const newProduct = newProducts.find((product) => product.url === existingProduct.url);
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

				const uniqueProducts = newProducts.filter(
					(newProduct) => !store.items.some((existingProduct) => existingProduct.url === newProduct.url)
				);

				for (const product of uniqueProducts) {
					for (const tag of product.tags) {
						newTags.add(tag);
					}
				}

				return {
					...store,
					items: [...uniqueProducts, ...updatedItems],
					currentPage: 1
				};
			});

			for (const tag of newTags) {
				addToTagMaster(tag);
			}
		});
	},
	deleteProduct: (url: string) => {
		return afterInitialization(() => {
			applyProductUpdate((store) => {
				const productToDelete = store.items.find((item) => item.url === url);
				if (!productToDelete) {
					return store;
				}

				const newItems = store.items.filter((item) => item.url !== url);

				for (const tag of productToDelete.tags) {
					const isTagUsed = newItems.some((item) => item.tags.includes(tag));
					if (!isTagUsed) {
						removeFromTagMaster(tag);
					}
				}

				return {
					...store,
					items: newItems
				};
			});
		});
	},
	exportProducts: () => {
		let exportItems: Product[] = [];

		updateProducts((store) => {
			exportItems = store.items;
			return store;
		});

		return JSON.stringify(exportItems, null, 2);
	}
};

export function addToTagMaster(tag: string) {
	tagMasterStore.update((tags) => {
		if (!tags.includes(tag)) {
			return [...tags, tag];
		}
		return tags;
	});
}

export function removeFromTagMaster(tag: string) {
	let isTagInUse = false;
	productStore.subscribe((store) => {
		isTagInUse = store.items.some((item) => item.tags.includes(tag));
	})();

	if (!isTagInUse) {
		tagMasterStore.update((tags) => tags.filter((currentTag) => currentTag !== tag));
		return true;
	}

	return false;
}

async function loadInitialData() {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		let items = await getAllProductsFromDb();
		let tags = await loadTagsFromDb();
		let order = await loadProductOrderFromDb();

		if (items.length === 0) {
			const legacyItems = loadLegacyProducts();

			if (legacyItems.length > 0) {
				items = legacyItems;
				tags = loadLegacyTags();
			} else {
				items = initData.items as Product[];
			}

			if (tags.length === 0) {
				tags = deriveTagMaster(items);
			}

			order = items.map((item) => item.url);

			await Promise.all([
				replaceProductsInDb(items),
				saveTagsToDb(tags),
				saveProductOrderToDb(order)
			]);
		} else {
			if (order.length === 0) {
				order = items.map((item) => item.url);
				await saveProductOrderToDb(order);
			}

			items = orderProducts(items, order);
		}

		if (tags.length === 0) {
			tags = deriveTagMaster(items);
			await saveTagsToDb(tags);
		}

		replaceItems(items);
		setTags(tags);
		isInitialized = true;
	} catch (error) {
		console.error('Failed to load initial data:', error);
		isInitialized = true;
	}
}

function ensureInitialized() {
	if (!initializeStorePromise) {
		initializeStorePromise = loadInitialData();
	}

	return initializeStorePromise;
}

if (typeof window !== 'undefined') {
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') {
			void reloadFromDb();
		}
	});

	window.addEventListener('storage', (event) => {
		if (event.key === PAGE_SIZE_KEY && event.newValue) {
			const pageSize = Number.parseInt(event.newValue, 10);
			if (Number.isFinite(pageSize)) {
				syncPageSize(pageSize);
			}
		}
	});

	syncChannel?.addEventListener('message', (event: MessageEvent<{ type?: string }>) => {
		if (event.data?.type === 'products-changed' || event.data?.type === 'tags-changed') {
			void reloadFromDb();
		}
	});
}

void ensureInitialized();

import type { Product } from '../stores/productStore';

const DB_NAME = 'booth-library-db';
const DB_VERSION = 1;
const PRODUCT_STORE = 'products';
const META_STORE = 'meta';

const TAGS_KEY = 'tags';
const PRODUCT_ORDER_KEY = 'product-order';

let dbPromise: Promise<IDBDatabase> | null = null;

function openRequestAsPromise<T>(request: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
	});
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
	return new Promise((resolve, reject) => {
		transaction.oncomplete = () => resolve();
		transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
		transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
	});
}

function requestSucceeded(request: IDBRequest): Promise<void> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
	});
}

async function getDb(): Promise<IDBDatabase> {
	if (!dbPromise) {
		dbPromise = new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onupgradeneeded = () => {
				const db = request.result;

				if (!db.objectStoreNames.contains(PRODUCT_STORE)) {
					db.createObjectStore(PRODUCT_STORE, { keyPath: 'url' });
				}

				if (!db.objectStoreNames.contains(META_STORE)) {
					db.createObjectStore(META_STORE, { keyPath: 'key' });
				}
			};

			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
		});
	}

	return dbPromise;
}

export async function getAllProductsFromDb(): Promise<Product[]> {
	const db = await getDb();
	const transaction = db.transaction(PRODUCT_STORE, 'readonly');
	const store = transaction.objectStore(PRODUCT_STORE);
	const items = await openRequestAsPromise(store.getAll());
	await transactionDone(transaction);
	return items as Product[];
}

export async function replaceProductsInDb(products: Product[]): Promise<void> {
	const db = await getDb();
	const transaction = db.transaction(PRODUCT_STORE, 'readwrite');
	const store = transaction.objectStore(PRODUCT_STORE);
	const clearRequest = store.clear();

	await requestSucceeded(clearRequest);

	for (const product of products) {
		store.put(product);
	}

	await transactionDone(transaction);
}

export async function putProductsInDb(products: Product[]): Promise<void> {
	if (products.length === 0) {
		return;
	}

	const db = await getDb();
	const transaction = db.transaction(PRODUCT_STORE, 'readwrite');
	const store = transaction.objectStore(PRODUCT_STORE);

	for (const product of products) {
		store.put(product);
	}

	await transactionDone(transaction);
}

export async function deleteProductsFromDb(urls: string[]): Promise<void> {
	if (urls.length === 0) {
		return;
	}

	const db = await getDb();
	const transaction = db.transaction(PRODUCT_STORE, 'readwrite');
	const store = transaction.objectStore(PRODUCT_STORE);

	for (const url of urls) {
		store.delete(url);
	}

	await transactionDone(transaction);
}

export async function saveTagsToDb(tags: string[]): Promise<void> {
	const db = await getDb();
	const transaction = db.transaction(META_STORE, 'readwrite');
	const store = transaction.objectStore(META_STORE);

	await openRequestAsPromise(store.put({ key: TAGS_KEY, value: tags }));
	await transactionDone(transaction);
}

export async function loadTagsFromDb(): Promise<string[]> {
	const db = await getDb();
	const transaction = db.transaction(META_STORE, 'readonly');
	const store = transaction.objectStore(META_STORE);
	const result = await openRequestAsPromise(store.get(TAGS_KEY));
	await transactionDone(transaction);
	return Array.isArray(result?.value) ? (result.value as string[]) : [];
}

export async function saveProductOrderToDb(order: string[]): Promise<void> {
	const db = await getDb();
	const transaction = db.transaction(META_STORE, 'readwrite');
	const store = transaction.objectStore(META_STORE);

	await openRequestAsPromise(store.put({ key: PRODUCT_ORDER_KEY, value: order }));
	await transactionDone(transaction);
}

export async function loadProductOrderFromDb(): Promise<string[]> {
	const db = await getDb();
	const transaction = db.transaction(META_STORE, 'readonly');
	const store = transaction.objectStore(META_STORE);
	const result = await openRequestAsPromise(store.get(PRODUCT_ORDER_KEY));
	await transactionDone(transaction);
	return Array.isArray(result?.value) ? (result.value as string[]) : [];
}

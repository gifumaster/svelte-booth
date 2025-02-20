<script lang="ts">
    import { productStore, type Product } from '../stores/productStore';
    import { toastStore } from '../stores/toastStore';

    export let isOpen = false;
    export let onClose: () => void;

    let jsonText = '';

    const exampleFormat = `[
  {
    "title": "商品タイトル",
    "url": "https://booth.pm/ja/items/xxxxx",
    "imageUrl": "https://booth.pm/images/xxxxx.jpg"
  }
]`;

    function handleSubmit() {
        try {
            const json = JSON.parse(jsonText);

            // 配列形式のチェック
            if (!Array.isArray(json)) {
                throw new Error('JSONは配列形式である必要があります');
            }

            const validProducts = json.filter((item): item is Product => {
                return (
                    typeof item === 'object' &&
                    item !== null &&
                    typeof item.title === 'string' &&
                    typeof item.url === 'string' &&
                    typeof item.imageUrl === 'string'
                );
            });

            if (validProducts.length === 0) {
                throw new Error('有効な商品データが見つかりませんでした');
            }

            // タグ配列を追加
            const productsWithTags = validProducts.map(product => ({
                ...product,
                tags: [] as string[]
            }));

            productStore.addProducts(productsWithTags);
            toastStore.show('商品情報を追加しました', 'success');
            jsonText = '';
            onClose();
        } catch (error) {
            toastStore.show(error instanceof Error ? error.message : 'JSONの解析に失敗しました', 'error');
        }
    }
</script>

{#if isOpen}
    <div class="dialog-overlay" on:click={onClose}>
        <div class="dialog" on:click|stopPropagation>
            <div class="dialog-header">
                <h2>JSON商品データの追加</h2>
                <button class="close-button" on:click={onClose}>&times;</button>
            </div>
            <div class="dialog-content">
                <div class="format-info">
                    <p>以下の形式のJSONを入力してください：</p>
                    <pre>{exampleFormat}</pre>
                </div>
                <textarea
                    bind:value={jsonText}
                    placeholder="ここにJSONデータを貼り付けてください"
                    rows="10"
                ></textarea>
                <div class="dialog-actions">
                    <button class="cancel-button" on:click={onClose}>キャンセル</button>
                    <button class="submit-button" on:click={handleSubmit}>追加</button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
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
        max-width: 600px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
    }

    .dialog-header {
        padding: 1rem;
        border-bottom: 1px solid #dee2e6;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .dialog-header h2 {
        margin: 0;
        font-size: 1.25rem;
    }

    .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.5rem;
    }

    .dialog-content {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .format-info {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 4px;
        font-size: 0.9rem;
    }

    .format-info p {
        margin: 0 0 0.5rem 0;
    }

    pre {
        background: #fff;
        padding: 0.5rem;
        border-radius: 4px;
        margin: 0;
        white-space: pre-wrap;
        font-size: 0.8rem;
    }

    textarea {
        width: 100%;
        resize: vertical;
        padding: 0.5rem;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        font-family: monospace;
    }

    .dialog-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
    }

    button {
        padding: 0.5rem 1rem;
        border-radius: 4px;
        border: none;
        cursor: pointer;
    }

    .cancel-button {
        background: #f8f9fa;
        color: #212529;
    }

    .submit-button {
        background: #0d6efd;
        color: white;
    }
</style>
<script lang="ts">
    import { productStore, type Product } from '../stores/productStore';
    import { toastStore } from '../stores/toastStore';
    import { DownloadIcon } from 'lucide-svelte';

    export let isOpen = false;
    export let onClose: () => void;

    let jsonText = '';

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
                    typeof item.imageUrl === 'string' &&
                    (item.shop === undefined || typeof item.shop === 'string')
                );
            }).map(item => ({
                ...item,
                tags: Array.isArray(item.tags) ? item.tags : []
            }));

            if (validProducts.length === 0) {
                throw new Error('有効な商品データが見つかりませんでした');
            }

            productStore.addProducts(validProducts);
            toastStore.show('商品情報を追加しました', 'success');
            jsonText = '';
            onClose();
        } catch (error) {
            toastStore.show(error instanceof Error ? error.message : 'JSONの解析に失敗しました', 'error');
        }
    }

    function exportProducts() {
        const data = productStore.exportProducts();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'booth-library-export.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toastStore.show('商品データをエクスポートしました', 'success');
    }
</script>

{#if isOpen}
 <!-- svelte-ignore a11y-click-events-have-key-events -->
 <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="dialog-overlay" onclick={onClose}>
        <div class="dialog" onclick={(e) => e.stopPropagation()}>
            <div class="dialog-header">
                <h2>商品データの管理</h2>
                <button class="close-button" onclick={onClose}>&times;</button>
            </div>
            <div class="dialog-content">
                <div class="script-info">
                    <h3>BOOTH Item Extractor 🔍</h3>
                    <p>BOOTHの商品データを簡単に取得できるユーザースクリプトを使用できます：</p>
                    <ol>
                        <li>
                            <a href="https://www.tampermonkey.net/" target="_blank" rel="noopener noreferrer">
                                Tampermonkey
                            </a>
                            をインストール
                        </li>
                        <li>
                            <a href="https://greasyfork.org/ja/scripts/527522-booth-item-extractor" target="_blank" rel="noopener noreferrer">
                                BOOTH Item Extractor
                            </a>
                            をインストール
                        </li>
                        <li>BOOTHの<a href="https://accounts.booth.pm/library">ライブラリページ</a>を開く</li>
                        <li>ページ右下に表示される「Extract All Pages」ボタンをクリック</li>
                        <li>生成されたJSONデータを下記の入力欄に貼り付け</li>
                        <li>以降、少しずつ追加する場合は「「Extract Current Pages」でOK</li>
                    </ol>
                </div>
                <textarea
                    bind:value={jsonText}
                    placeholder="ここに貼り付けてください"
                    rows="10"
                ></textarea>
                <div class="dialog-actions">
                    <div class="dialog-actions-left">
                        <button 
                            class="export-button" 
                            onclick={exportProducts}
                            title="商品データをエクスポート"
                        >
                            <DownloadIcon size={20} />
                            エクスポート
                        </button>
                    </div>
                    <div class="dialog-actions-right">
                        <button class="cancel-button" onclick={onClose}>キャンセル</button>
                        <button class="submit-button" onclick={handleSubmit}>追加</button>
                    </div>
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
        max-width: 800px;
        max-height: 95vh;
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

    .script-info {
        background: #e3f2fd;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1rem;
    }

    .script-info h3 {
        margin: 0 0 0.5rem 0;
        color: #0d47a1;
    }

    .script-info p {
        margin: 0 0 0.5rem 0;
    }

    .script-info ol {
        margin: 0;
        padding-left: 1.5rem;
    }

    .script-info li {
        margin: 0.25rem 0;
    }

    .script-info a {
        color: #1976d2;
        text-decoration: none;
    }

    .script-info a:hover {
        text-decoration: underline;
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
        justify-content: space-between;
        align-items: center;
        margin-top: 1rem;
    }

    .dialog-actions-left {
        display: flex;
        gap: 0.5rem;
    }

    .dialog-actions-right {
        display: flex;
        gap: 0.5rem;
    }

    .export-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: #198754;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .export-button:hover {
        background: #157347;
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
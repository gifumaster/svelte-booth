<script lang="ts">
    export let showDialog: boolean;
</script>

{#if showDialog}
 <!-- svelte-ignore a11y-click-events-have-key-events -->
 <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal-backdrop" onclick={() => showDialog = false}>
        <div class="modal" onclick={(e) => e.stopPropagation}>
            <div class="modal-header">
                <h3>ヘルプ</h3>
                <button class="close-button" onclick={() => showDialog = false}>&times;</button>
            </div>
            <div class="modal-content">
                <section>
                    <h4>🔍 主な機能</h4>
                    <ul>
                        <li>商品名による検索</li>
                        <li>タグによるフィルタリング（複数タグの組み合わせ可能）</li>
                        <li>商品へのタグ付け（1商品につき最大10個まで）</li>
                        <li>複数商品の一括タグ付け機能</li>
                    </ul>
                </section>

                <section>
                    <h4>📥 商品データの追加方法</h4>
                    <p>商品データの追加には「BOOTH Item Extractor」ユーザースクリプトを使用します。</p>
                    <p>「ライブラリに追加」ボタンをクリックして、指示に従って商品データをインポートしてください。</p>
                </section>

                <section>
                    <h4>🏷️ タグの使い方</h4>
                    <ul>
                        <li>商品カードのタグアイコンをクリックしてタグを追加</li>
                        <li>複数選択モード（チェックボックスアイコン）で一括タグ付け可能</li>
                        <li>タグは商品の整理・分類に活用できます</li>
                        <li>1つのタグは最大10文字まで</li>
                    </ul>
                </section>

                <section>
                    <h4>🔒 セキュリティと保存について</h4>
                    <ul>
                        <li>すべてのデータはブラウザのローカルストレージに保存されます</li>
                        <li>外部サーバーとの通信は一切行いません</li>
                        <li>商品データは手動でエクスポート・インポートする必要があります</li>
                    </ul>
                </section>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal {
        background: white;
        padding: 20px;
        border-radius: 8px;
        width: 80%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }

    .modal-header h3 {
        margin: 0;
        font-size: 1.5rem;
    }

    .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0 8px;
    }

    .close-button:hover {
        color: #666;
    }

    .modal-content {
        line-height: 1.6;
    }

    section {
        margin-bottom: 2rem;
    }

    h4 {
        margin: 0 0 1rem 0;
        color: #1a73e8;
        font-size: 1.1rem;
    }

    ul {
        margin: 0;
        padding-left: 1.5rem;
        line-height: 1.6;
    }

    li {
        margin-bottom: 0.5rem;
    }

    p {
        margin: 0 0 1rem 0;
        line-height: 1.6;
    }
</style>
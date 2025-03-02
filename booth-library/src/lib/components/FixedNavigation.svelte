<script lang="ts">
  const shareUrl = encodeURIComponent('https://gifumaster.github.io/booth-library/');
  const shareText = encodeURIComponent('Boothのアイテムをブラウザで管理！');
  const twitterUrl = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`;
</script>

<div class="fixed-nav">
  <a href="https://gifumaster.github.io/simple_resizer/" target="_blank" rel="noopener noreferrer">
    <button class="nav-button">アバターサムネイル作成</button>
  </a>
  <a href="https://accounts.booth.pm/library" target="_blank" rel="noopener noreferrer">
    <button class="nav-button">Booth:ライブラリ</button>
  </a>
  <a href={twitterUrl} target="_blank" rel="noopener noreferrer">
    <button class="nav-button">Twitterでシェア</button>
  </a>
</div>

<style>
  .fixed-nav {
    position: fixed;
    bottom: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 1000;
  }

  .nav-button {
    padding: 8px 16px;
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .nav-button:hover {
    background-color: #f5f5f5;
    transform: translateY(-1px);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
  }
</style>
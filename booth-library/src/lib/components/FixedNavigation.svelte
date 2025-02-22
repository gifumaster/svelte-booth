<script lang="ts">
</script>

<div class="fixed-nav">
  <a href="https://accounts.booth.pm/wish_lists" target="_blank" rel="noopener noreferrer">
    <button class="nav-button">♡スキ</button>
  </a>
  <a href="https://accounts.booth.pm/library" target="_blank" rel="noopener noreferrer">
    <button class="nav-button">ライブラリ</button>
  </a>
  <a href="https://accounts.booth.pm/orders?total=0&auto=0&page=1" target="_blank" rel="noopener noreferrer">
    <button class="nav-button">購入履歴</button>
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
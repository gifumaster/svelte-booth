<script lang="ts">
    import { fade } from 'svelte/transition';

    // スプラッシュ画面の表示状態を制御するプロパティ
    let { isVisible = true } = $props();
</script>

{#if isVisible}
<div class="splash-screen" transition:fade={{ duration: 300 }}>
    <div class="splash-content">
        <h1 class="title">Library Searcher For Booth</h1>
        <div class="loading-indicator">
            <div class="loading-bar"></div>
        </div>
    </div>
</div>
{/if}

<style>
    .splash-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #ffffff;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .splash-content {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
    }

    .title {
        font-size: 2rem;
        font-weight: bold;
        color: #333;
        margin: 0;
        position: relative;
        overflow: hidden;
        animation: light-effect 3s infinite;
    }

    .title::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 50%;
        height: 100%;
        background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%);
        transform: skewX(-25deg);
        animation: light-shaft 3s infinite;
    }

    .loading-indicator {
        width: 200px;
        height: 4px;
        background-color: #e9ecef;
        border-radius: 2px;
        overflow: hidden;
        position: relative;
    }

    .loading-bar {
        height: 100%;
        width: 30%;
        background-color: #0d6efd;
        position: absolute;
        left: 0;
        animation: loading 1.5s infinite ease-in-out;
    }

    @keyframes light-shaft {
        0% {
            left: -100%;
        }
        50%, 100% {
            left: 200%;
        }
    }

    @keyframes light-effect {
        0% {
            color: #333;
            text-shadow: none;
        }
        50% {
            color: #0d6efd;
            text-shadow: 0 0 10px rgba(13, 110, 253, 0.5);
        }
        100% {
            color: #333;
            text-shadow: none;
        }
    }

    @keyframes loading {
        0% {
            left: -30%;
        }
        100% {
            left: 100%;
        }
    }
</style>
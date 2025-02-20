<script lang="ts">
    import HelpDialog from './HelpDialog.svelte';
    let showDialog = false;

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' || event.key === ' ') {
            showDialog = true;
            event.preventDefault();
        }
    }
</script>

<div 
    class="title" 
    on:click={() => showDialog = true}
    on:keydown={handleKeydown}
    role="button"
    tabindex="0"
>
    <h2>Liberary Searcher For Booth</h2>
</div>

<HelpDialog bind:showDialog />

<style>
    .title {
        position: fixed;
        left: 20px;
        bottom: 20px;
        z-index: 100;
        background: rgba(255, 255, 255, 0.9);
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease;
    }

    .title:hover {
        transform: translateY(-2px);
    }

    h2 {
        margin: 0;
        font-size: 1.2rem;
        color: #333;
        font-weight: 600;
        background: linear-gradient(45deg, #4a90e2, #845ec2);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
    }
</style>
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

<div class="title-container">
    <h2>Liberary Searcher For Booth</h2>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
        class="help-icon"
        onclick={() => showDialog = true}
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
    </div>
</div>

<HelpDialog bind:showDialog />

<style>
    .title-container {
        position: fixed;
        left: 20px;
        bottom: 20px;
        z-index: 100;
        background: rgba(255, 255, 255, 0.9);
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease;
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .title-container:hover {
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

    .help-icon {
        cursor: pointer;
        color: #4a90e2;
        transition: color 0.2s ease;
    }

    .help-icon:hover {
        color: #845ec2;
    }
</style>
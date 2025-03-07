<script lang="ts">
    import ProductGrid from '$lib/components/ProductGrid.svelte';
</script>

<svelte:head>
    <title>Library Searcher For Booth</title>
</svelte:head>

<main>
    <ProductGrid />
</main>

<style>
    main {
        max-width: 90vw;
        margin: 0 auto;
        padding: 2rem;
    }
</style>

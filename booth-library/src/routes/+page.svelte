<script lang="ts">
    import ProductGrid from '$lib/components/ProductGrid.svelte';
    import Title from '$lib/components/Title.svelte';
</script>

<svelte:head>
    <title>Library Searcher For Booth</title>
</svelte:head>

<main>
    <ProductGrid />
    <Title />
</main>

<style>
    main {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }
</style>

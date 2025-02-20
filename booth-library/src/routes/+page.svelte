<script lang="ts">
    import ProductGrid from '$lib/components/ProductGrid.svelte';
</script>

<main>
    <h1>商品管理</h1>
    <ProductGrid />
</main>

<style>
    main {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }

    h1 {
        margin-bottom: 2rem;
        text-align: center;
    }
</style>

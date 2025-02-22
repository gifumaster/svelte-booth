<script lang="ts">
	import '../app.css';
	import FixedNavigation from '$lib/components/FixedNavigation.svelte';
	let { children } = $props();
</script>

{@render children()}
<FixedNavigation />

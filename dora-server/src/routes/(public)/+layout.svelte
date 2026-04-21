<script lang="ts">
	import PageHeader from '$lib/ui/PageHeader.svelte';

	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<PageHeader />
	<main class="flex-1">{@render children()}</main>
	<footer class="footer footer-center bg-base-200 p-6 text-base-content">
		<aside>
			<p>© {new Date().getFullYear()} Whitelist Browser</p>
		</aside>
	</footer>
</div>


<script lang="ts">
	let { children } = $props();
</script>

<div class="mx-auto flex min-h-[calc(100vh-160px)] max-w-lg items-center px-6 py-10">
	<div class="w-full">{@render children()}</div>
</div>


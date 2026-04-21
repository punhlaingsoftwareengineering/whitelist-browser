<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { loadConnection } from '$lib/deviceStorage';

	onMount(() => {
		goto(loadConnection() ? '/home' : '/auth/connect');
	});
</script>

<div class="flex min-h-[60vh] items-center justify-center">
	<span class="loading loading-spinner loading-lg" aria-label="Loading"></span>
</div>

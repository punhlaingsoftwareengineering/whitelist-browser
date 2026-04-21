<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/onboarding');
	});
</script>

<div class="flex min-h-[60vh] items-center justify-center">
	<span class="loading loading-spinner loading-lg" aria-label="Loading"></span>
</div>

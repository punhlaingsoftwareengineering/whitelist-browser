<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { initDeviceStorage } from '$lib/deviceStorage';
	import { checkForUpdate, relaunchApp, type DownloadEvent, type UpdateHandle } from '$lib/updater';

	let { children } = $props();
	let storageReady = $state(false);

	const UPDATE_DISMISS_KEY = 'wb.updateBanner.dismiss';
	const UPDATE_POLL_MS = 15 * 60 * 1000;

	let pendingUpdate = $state<{ version: string; handle: UpdateHandle } | null>(null);
	let updateBannerDismissed = $state(false);
	let updateBannerInstalling = $state(false);
	let updateBannerError = $state<string | null>(null);

	function syncDismissedForVersion(version: string) {
		updateBannerDismissed = sessionStorage.getItem(UPDATE_DISMISS_KEY) === version;
	}

	async function pollForUpdate() {
		try {
			const u = await checkForUpdate();
			if (u) {
				pendingUpdate = { version: u.version, handle: u };
				syncDismissedForVersion(u.version);
			} else {
				pendingUpdate = null;
			}
		} catch {
			// Dev build, offline, or updater not configured — ignore.
		}
	}

	onMount(() => {
		let pollId: ReturnType<typeof setInterval> | undefined;

		void initDeviceStorage().then(() => {
			storageReady = true;
			void pollForUpdate();
			pollId = setInterval(() => void pollForUpdate(), UPDATE_POLL_MS);
		});

		return () => {
			if (pollId !== undefined) clearInterval(pollId);
		};
	});

	function dismissUpdateBanner() {
		if (pendingUpdate) sessionStorage.setItem(UPDATE_DISMISS_KEY, pendingUpdate.version);
		updateBannerDismissed = true;
		updateBannerError = null;
	}

	async function installPendingUpdate() {
		if (!pendingUpdate) return;
		updateBannerError = null;
		updateBannerInstalling = true;
		const handle = pendingUpdate.handle;
		try {
			await handle.downloadAndInstall((evt: DownloadEvent) => {
				if (evt.event === 'Finished') {
					void relaunchApp();
				}
			});
			await relaunchApp();
		} catch (e) {
			updateBannerInstalling = false;
			updateBannerError = e instanceof Error ? e.message : 'Update failed';
		}
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div data-theme="winter" class="min-h-screen antialiased">
	{#if !storageReady}
		<div class="flex min-h-screen items-center justify-center bg-base-200">
			<div class="flex flex-col items-center gap-3">
				<span class="loading loading-spinner loading-lg text-primary" aria-label="Loading"></span>
				<p class="text-sm text-base-content/60">Loading…</p>
			</div>
		</div>
	{:else}
		{#if pendingUpdate && !updateBannerDismissed}
			<div role="alert" class="alert alert-info rounded-none border-b border-base-300">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					class="h-6 w-6 shrink-0 stroke-current"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<div class="min-w-0 flex-1">
					<h3 class="font-bold">Update available</h3>
					<div class="text-sm opacity-90">
						Version <span class="font-mono tabular-nums">{pendingUpdate.version}</span> is ready to install.
					</div>
					{#if updateBannerError}
						<div class="mt-1 truncate text-xs text-error" title={updateBannerError}>{updateBannerError}</div>
					{/if}
				</div>
				<div class="flex shrink-0 flex-wrap justify-end gap-2">
					<button type="button" class="btn btn-sm" disabled={updateBannerInstalling} onclick={dismissUpdateBanner}>
						Later
					</button>
					<button
						type="button"
						class="btn btn-primary btn-sm"
						disabled={updateBannerInstalling}
						onclick={installPendingUpdate}
					>
						{#if updateBannerInstalling}
							<span class="loading loading-spinner loading-xs"></span>
							Installing…
						{:else}
							Update
						{/if}
					</button>
				</div>
			</div>
		{/if}
		{@render children()}
	{/if}
</div>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { clearConnection, loadConnection } from '$lib/deviceStorage';
	import { checkForUpdate, relaunchApp, type DownloadEvent, type UpdateHandle } from '$lib/updater';
	import { getDeviceOptionsWithTimeout } from '$lib/api';
	import { resolveAppVersion } from '$lib/appVersion';

	let { children } = $props();
	let appVersion = $state<string | null>(null);
	type UpdateState =
		| { kind: 'idle' }
		| { kind: 'checking' }
		| { kind: 'none' }
		| { kind: 'available'; version: string; notes?: string; handle: UpdateHandle }
		| { kind: 'downloading'; progress: number; handle: UpdateHandle }
		| { kind: 'error'; message: string };

	let updateState = $state<UpdateState>({ kind: 'idle' });
	let verifying = $state(true);
	let verifyError = $state<string | null>(null);

	onMount(() => {
		void resolveAppVersion().then((v) => (appVersion = v));
	});

	onMount(() => {
		const conn = loadConnection();
		if (!conn) {
			goto('/auth/connect');
			return;
		}

		verifying = true;
		verifyError = null;
		getDeviceOptionsWithTimeout(conn.orgId, conn.deviceId, 2500)
			.then((opt) => {
				// if revoked, treat as logout
				if (opt.status === 'REJECTED' || opt.status === 'IGNORED') {
					clearConnection();
					goto('/auth/connect?status=revoked');
					return;
				}
				verifying = false;
			})
			.catch(() => {
				// Security requirement: no offline access to private pages.
				clearConnection();
				verifyError = 'Cannot reach server. Please reconnect.';
				goto('/auth/connect?status=server_unreachable');
			});
	});

	async function checkUpdates() {
		updateState = { kind: 'checking' };
		try {
			const update = await checkForUpdate();
			if (!update) {
				updateState = { kind: 'none' };
				(document.getElementById('modal-update') as HTMLDialogElement).showModal();
				return;
			}
			updateState = { kind: 'available', version: update.version, notes: update.body, handle: update };
			(document.getElementById('modal-update') as HTMLDialogElement).showModal();
		} catch (e) {
			updateState = { kind: 'error', message: e instanceof Error ? e.message : 'Update check failed' };
			(document.getElementById('modal-update') as HTMLDialogElement).showModal();
		}
	}

	async function downloadAndInstall() {
		if (updateState.kind !== 'available') return;
		const handle = updateState.handle;
		updateState = { kind: 'downloading', progress: 0, handle };
		try {
			await handle.downloadAndInstall((evt: DownloadEvent) => {
				if (evt.event === 'Progress') {
					// we only get chunk lengths here without total; show an indeterminate-ish progress
					updateState = {
						kind: 'downloading',
						handle,
						progress: Math.min(95, updateState.kind === 'downloading' ? updateState.progress + 1 : 1)
					};
				}
				if (evt.event === 'Finished') updateState = { kind: 'downloading', handle, progress: 100 };
			});
			await relaunchApp();
		} catch (e) {
			updateState = { kind: 'error', message: e instanceof Error ? e.message : 'Update failed' };
		}
	}
</script>

<div class="min-h-screen bg-base-200">
	<div class="navbar bg-base-100">
		<div class="navbar-start flex flex-col items-start gap-0 sm:flex-row sm:items-baseline sm:gap-2">
			<a class="btn btn-ghost text-xl" href="/home">Whitelist Browser</a>
			{#if appVersion}
				<span class="px-2 text-xs text-base-content/50 tabular-nums sm:pb-1">v{appVersion}</span>
			{/if}
		</div>
		<div class="navbar-end">
			<button class="btn btn-ghost" type="button" onclick={checkUpdates}>Check updates</button>
			<button
				class="btn btn-ghost"
				type="button"
				onclick={() => {
					clearConnection();
					goto('/auth/connect');
				}}
			>
				Disconnect
			</button>
		</div>
	</div>

	<div class="mx-auto max-w-6xl p-6">
		{#if verifying}
			<div class="flex min-h-[50vh] items-center justify-center">
				<span class="loading loading-spinner loading-lg" aria-label="Verifying"></span>
			</div>
		{:else}
			{@render children()}
		{/if}
	</div>
</div>

<dialog id="modal-update" class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg">Updates</h3>

		{#if updateState.kind === 'checking'}
			<p class="mt-2 text-sm text-base-content/70">Checking for updates…</p>
		{:else if updateState.kind === 'none'}
			<p class="mt-2 text-sm text-base-content/70">You’re up to date.</p>
		{:else if updateState.kind === 'available'}
			<p class="mt-2 text-sm text-base-content/70">Update available: <span class="font-mono">{updateState.version}</span></p>
			{#if updateState.notes}
				<div class="mt-3 rounded-box bg-base-200 p-3 text-sm whitespace-pre-wrap">{updateState.notes}</div>
			{/if}
		{:else if updateState.kind === 'downloading'}
			<p class="mt-2 text-sm text-base-content/70">Downloading and installing…</p>
			<progress class="progress progress-primary mt-3 w-full" value={updateState.progress} max="100"></progress>
		{:else if updateState.kind === 'error'}
			<div class="alert alert-error mt-3"><span>{updateState.message}</span></div>
			<p class="mt-2 text-sm text-base-content/70">
				Confirm `src-tauri/tauri.conf.json` has your updater `pubkey`, and the latest GitHub release includes a valid
				<code class="font-mono text-xs">latest.json</code> plus signed bundles (see Tauri updater docs).
			</p>
		{/if}

		<div class="modal-action">
			<form method="dialog"><button class="btn">Close</button></form>
			{#if updateState.kind === 'available'}
				<button class="btn btn-primary" type="button" onclick={downloadAndInstall}>Download & install</button>
			{/if}
		</div>
	</div>
</dialog>


<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { clearConnection, loadConnection } from '$lib/deviceStorage';
	import { checkForUpdate, relaunchApp, type DownloadEvent, type UpdateHandle } from '$lib/updater';
	import { getDeviceOptionsWithTimeout } from '$lib/api';
	import { resolveAppVersion } from '$lib/appVersion';
	import LogoMark from '$lib/ui/LogoMark.svelte';

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

	function runVerify() {
		const conn = loadConnection();
		if (!conn) {
			goto('/auth/connect');
			return;
		}

		verifying = true;
		verifyError = null;
		getDeviceOptionsWithTimeout(conn.orgId, conn.deviceId, 8000)
			.then((opt) => {
				if (opt.status === 'REJECTED' || opt.status === 'IGNORED') {
					clearConnection();
					goto('/auth/connect?status=revoked');
					return;
				}
				verifyError = null;
				verifying = false;
			})
			.catch(() => {
				verifyError =
					'Could not reach Dora. You can keep using the last saved sites below, or retry. Use Disconnect to sign out.';
				verifying = false;
			});
	}

	onMount(() => {
		runVerify();
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

<div class="min-h-screen bg-gradient-to-b from-base-200 to-base-300">
	{#if verifyError}
		<div
			class="flex flex-wrap items-center justify-between gap-3 border-b border-warning/30 bg-warning/10 px-4 py-3 text-sm"
			role="alert"
		>
			<span class="text-base-content/90">{verifyError}</span>
			<button type="button" class="btn btn-warning btn-sm shrink-0" onclick={() => runVerify()}>
				Retry connection
			</button>
		</div>
	{/if}

	<header class="navbar border-b border-base-300/80 bg-base-100/90 px-2 shadow-sm backdrop-blur-sm sm:px-4">
		<div class="navbar-start min-w-0 flex-1 gap-3">
			<a
				class="btn btn-ghost shrink gap-2 truncate px-2 text-lg font-semibold tracking-tight sm:text-xl"
				href="/home"
			>
				<LogoMark size={28} class="shrink-0" />
				<span class="truncate">Dora</span>
			</a>
			{#if appVersion}
				<span class="hidden text-xs text-base-content/45 tabular-nums sm:inline">v{appVersion}</span>
			{/if}
		</div>
		<div class="navbar-end shrink-0 gap-1">
			<button class="btn btn-ghost btn-sm" type="button" onclick={checkUpdates}>Updates</button>
			<button
				class="btn btn-ghost btn-sm text-error"
				type="button"
				onclick={() => {
					clearConnection();
					goto('/auth/connect');
				}}
			>
				Disconnect
			</button>
		</div>
	</header>

	<main class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
		{#if verifying}
			<div class="flex min-h-[45vh] flex-col items-center justify-center gap-3">
				<span class="loading loading-spinner loading-lg text-primary" aria-label="Verifying"></span>
				<p class="text-sm text-base-content/60">Checking with Dora…</p>
			</div>
		{:else}
			{@render children()}
		{/if}
	</main>
</div>

<dialog id="modal-update" class="modal">
	<div class="modal-box rounded-2xl">
		<h3 class="text-lg font-semibold">Updates</h3>

		{#if updateState.kind === 'checking'}
			<p class="mt-2 text-sm text-base-content/70">Checking for updates…</p>
		{:else if updateState.kind === 'none'}
			<p class="mt-2 text-sm text-base-content/70">You’re up to date.</p>
		{:else if updateState.kind === 'available'}
			<p class="mt-2 text-sm text-base-content/70">
				Update available: <span class="font-mono">{updateState.version}</span>
			</p>
			{#if updateState.notes}
				<div class="mt-3 max-h-48 overflow-y-auto rounded-xl bg-base-200 p-3 text-sm whitespace-pre-wrap">
					{updateState.notes}
				</div>
			{/if}
		{:else if updateState.kind === 'downloading'}
			<p class="mt-2 text-sm text-base-content/70">Downloading and installing…</p>
			<progress class="progress progress-primary mt-3 w-full" value={updateState.progress} max="100"></progress>
		{:else if updateState.kind === 'error'}
			<div class="alert alert-error mt-3"><span>{updateState.message}</span></div>
			<p class="mt-2 text-sm text-base-content/70">
				Confirm updater <code class="rounded bg-base-200 px-1 font-mono text-xs">pubkey</code> and GitHub release
				<code class="rounded bg-base-200 px-1 font-mono text-xs">latest.json</code>.
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

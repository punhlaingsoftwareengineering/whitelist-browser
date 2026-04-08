<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getOrCreateFingerprint, saveConfig, saveConnection, loadConnection } from '$lib/deviceStorage';
	import { postConnect, getRequestStatus } from '$lib/api';
	import { page } from '$app/state';
	import { resolveAppVersion } from '$lib/appVersion';
	import { checkForUpdate, relaunchApp, type DownloadEvent, type UpdateHandle } from '$lib/updater';

	let orgName = $state('');
	let appVersion = $state<string | null>(null);
	let secretKey = $state('');
	let requestId = $state<string | null>(null);
	let status = $state<string | null>(null);
	let error = $state<string | null>(null);
	let polling = $state(false);
	let statusBanner = $state<string | null>(null);
	let refreshBusy = $state(false);
	type UpdateState =
		| { kind: 'idle' }
		| { kind: 'checking' }
		| { kind: 'none' }
		| { kind: 'available'; version: string; notes?: string; handle: UpdateHandle }
		| { kind: 'downloading'; progress: number; handle: UpdateHandle }
		| { kind: 'error'; message: string };

	let updateState = $state<UpdateState>({ kind: 'idle' });

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

	function replayBannerFromUrl() {
		const s = page.url.searchParams.get('status');
		if (s === 'server_unreachable') {
			statusBanner =
				'Could not reach the server. Check your network, or try again — the app tries local dev and production hosts automatically.';
		} else if (s === 'revoked') {
			statusBanner = 'Your device access was revoked by an admin. Reconnect with a new request if allowed.';
		} else {
			statusBanner = null;
		}
	}

	async function pullRequestStatus() {
		if (!requestId) return;
		try {
			const s = await getRequestStatus(requestId);
			status = s.status;
			if (s.status === 'APPROVED' && s.orgId && s.deviceId && s.sites) {
				polling = false;
				saveConnection({ orgId: s.orgId, deviceId: s.deviceId });
				saveConfig({ proxy: s.proxy ?? null, sites: s.sites });
				goto('/home');
				return;
			}
			if (s.status === 'REJECTED' || s.status === 'IGNORED') {
				polling = false;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Unexpected error';
			polling = false;
		}
	}

	async function refreshConnect() {
		refreshBusy = true;
		error = null;
		try {
			if (requestId) {
				await pullRequestStatus();
			} else {
				replayBannerFromUrl();
			}
		} finally {
			refreshBusy = false;
		}
	}

	async function connect() {
		error = null;
		const deviceFingerprint = getOrCreateFingerprint();
		if (!orgName || !secretKey) throw new Error('Missing orgName/secretKey');

		const res = await postConnect({
			orgName,
			secretKey,
			deviceFingerprint,
			deviceInfo: { userAgent: navigator.userAgent, platform: navigator.platform }
		});
		requestId = res.requestId;
		status = 'PENDING';
		startPolling();
	}

	function startPolling() {
		if (!requestId) return;
		polling = true;

		const tick = async () => {
			if (!polling || !requestId) return;
			await pullRequestStatus();
			if (polling) setTimeout(tick, 1500);
		};

		tick();
	}

	onMount(() => {
		if (loadConnection()) {
			goto('/home');
			return;
		}
		replayBannerFromUrl();
		void resolveAppVersion().then((v) => (appVersion = v));
	});
</script>

<div class="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6">
	<div class="w-full max-w-2xl">
		<div
			class="overflow-hidden rounded-2xl border border-base-300/60 bg-base-100 shadow-lg shadow-base-300/40"
		>
			<div class="border-b border-base-200 bg-base-200/40 px-6 py-5 sm:px-8">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div>
						<h1 class="text-xl font-semibold tracking-tight sm:text-2xl">Connect</h1>
						<p class="mt-1 max-w-md text-sm text-base-content/65">
							Use the organization <span class="font-medium">code</span> and secret key from your admin.
						</p>
					</div>
					<button
						type="button"
						class="btn btn-outline btn-sm gap-1.5 rounded-lg"
						onclick={() => refreshConnect()}
						disabled={refreshBusy}
						aria-busy={refreshBusy}
					>
						{#if refreshBusy}
							<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
						{/if}
						Refresh
					</button>
					<button type="button" class="btn btn-ghost btn-sm rounded-lg" onclick={checkUpdates}>Updates</button>
				</div>
			</div>

			<div class="px-6 py-6 sm:px-8 sm:py-8">
				{#if statusBanner}
					<div class="alert alert-warning mb-6 rounded-xl border-0">
						<div class="text-sm">{statusBanner}</div>
					</div>
				{/if}

				{#if error}
					<div class="alert alert-error mb-6 rounded-xl"><span class="text-sm">{error}</span></div>
				{/if}

				<form
					class="space-y-6"
					onsubmit={(e) => {
						e.preventDefault();
						connect();
					}}
				>
					<div class="grid gap-5 sm:grid-cols-2 sm:gap-6">
						<label class="form-control w-full">
							<div class="label pt-0 pb-1.5">
								<span class="label-text font-medium text-base-content/80">Organization code</span>
								<span class="label-text-alt text-xs text-base-content/50">Example: pun_hlaing_hospitals</span>
							</div>
							<input
								class="input input-bordered input-md w-full rounded-xl border-base-300 bg-base-100"
								bind:value={orgName}
								required
								autocomplete="organization"
							/>
						</label>
						<label class="form-control w-full">
							<div class="label pt-0 pb-1.5">
								<span class="label-text font-medium text-base-content/80">Secret key</span>
							</div>
							<input
								class="input input-bordered input-md w-full rounded-xl border-base-300 bg-base-100 font-mono text-sm tracking-wide"
								placeholder="••••••••••••"
								type="password"
								bind:value={secretKey}
								required
								autocomplete="off"
							/>
						</label>
					</div>

					<button
						class="btn btn-primary btn-md w-full rounded-xl sm:w-auto sm:min-w-[10rem]"
						type="submit"
						disabled={!orgName || !secretKey || polling}
					>
						{#if polling}
							<span class="loading loading-spinner loading-sm"></span>
							Waiting…
						{:else}
							Connect
						{/if}
					</button>
				</form>

				{#if requestId}
					<div class="mt-8 rounded-xl border border-base-200 bg-base-200/35 p-4 text-sm">
						<div class="font-medium text-base-content">Request submitted</div>
						<div class="mt-2 text-base-content/70">
							ID <span class="font-mono text-xs">{requestId}</span>
						</div>
						<div class="mt-2 flex flex-wrap items-center gap-2">
							<span class="text-base-content/70">Status</span>
							<span class="badge badge-ghost badge-sm font-mono">{status ?? 'PENDING'}</span>
							{#if polling}
								<span class="loading loading-dots loading-sm text-primary" aria-label="Waiting"></span>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>

		{#if appVersion}
			<p class="mt-8 text-center text-xs text-base-content/45 tabular-nums">Version {appVersion}</p>
		{/if}
	</div>
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
		{/if}

		<div class="modal-action">
			<form method="dialog"><button class="btn">Close</button></form>
			{#if updateState.kind === 'available'}
				<button class="btn btn-primary" type="button" onclick={downloadAndInstall}>Download & install</button>
			{/if}
		</div>
	</div>
</dialog>

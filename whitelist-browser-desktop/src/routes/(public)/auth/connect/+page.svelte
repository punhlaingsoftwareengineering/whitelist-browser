<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getOrCreateFingerprint, saveConfig, saveConnection } from '$lib/deviceStorage';
	import { postConnect, getRequestStatus } from '$lib/api';
	import { page } from '$app/state';
	import { resolveAppVersion } from '$lib/appVersion';

	let orgName = $state('');
	let appVersion = $state<string | null>(null);
	let secretKey = $state('');
	let requestId = $state<string | null>(null);
	let status = $state<string | null>(null);
	let error = $state<string | null>(null);
	let polling = $state(false);
	let statusBanner = $state<string | null>(null);
	let refreshBusy = $state(false);

	function replayBannerFromUrl() {
		const s = page.url.searchParams.get('status');
		if (s === 'server_unreachable') {
			statusBanner = 'Server unreachable. Please check your internet/VPN/proxy settings and reconnect.';
		} else if (s === 'revoked') {
			statusBanner = 'Your device access was revoked by an admin. Please reconnect to request access again.';
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
		replayBannerFromUrl();
		void resolveAppVersion().then((v) => (appVersion = v));
	});
</script>

<div
	class="mx-auto flex min-h-[calc(100vh-60px)] w-full max-w-lg flex-col items-center justify-center px-6 py-10"
>
	<div class="card w-full bg-base-100 shadow">
		<div class="card-body gap-4">
			<div class="flex flex-wrap items-start justify-between gap-2">
				<h1 class="card-title text-2xl">Connect to an organization</h1>
				<button
					type="button"
					class="btn btn-outline btn-sm shrink-0 gap-1"
					onclick={() => refreshConnect()}
					disabled={refreshBusy}
					aria-busy={refreshBusy}
				>
					{#if refreshBusy}
						<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
					{/if}
					Refresh
				</button>
			</div>
			<p class="text-sm text-base-content/70">Enter the org name + secret key provided by your admin.</p>

			{#if statusBanner}
				<div class="alert alert-warning">
					<div class="space-y-1">
						<div class="font-semibold">Connection required</div>
						<div class="text-sm">{statusBanner}</div>
					</div>
				</div>
			{/if}

			{#if error}
				<div class="alert alert-error"><span>{error}</span></div>
			{/if}

			<form
				class="grid gap-3"
				onsubmit={(e) => {
					e.preventDefault();
					connect();
				}}
			>
				<label class="form-control">
					<div class="label"><span class="label-text">Organization name</span></div>
					<input class="input input-bordered" bind:value={orgName} required />
				</label>
				<label class="form-control">
					<div class="label"><span class="label-text">Secret key</span></div>
					<input class="input input-bordered" bind:value={secretKey} required />
				</label>

				<button class="btn btn-primary" type="submit" disabled={!orgName || !secretKey || polling}>
					Connect
				</button>
			</form>

			{#if requestId}
				<div class="rounded-box bg-base-200 p-4 text-sm">
					<div class="font-semibold">Request submitted</div>
					<div class="mt-1 text-base-content/70">Request ID: <span class="font-mono">{requestId}</span></div>
					<div class="mt-1">
						Status:
						<span class="badge badge-outline">{status ?? 'PENDING'}</span>
					</div>
					{#if polling}
						<div class="mt-2"><span class="loading loading-dots" aria-label="Waiting"></span></div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
	{#if appVersion}
		<p class="mt-6 text-center text-xs text-base-content/50 tabular-nums">Version {appVersion}</p>
	{/if}
</div>

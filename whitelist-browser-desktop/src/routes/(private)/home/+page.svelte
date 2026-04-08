<script lang="ts">
	import { onMount } from 'svelte';
	import { getDeviceOptions, SERVER_ORIGIN } from '$lib/api';
	import { loadConfig } from '$lib/deviceStorage';
	import { loadConnection } from '$lib/deviceStorage';
	import { saveConfig } from '$lib/deviceStorage';
	import { clearConnection } from '$lib/deviceStorage';
	import { isAllowed as isAllowedPattern } from '$lib/allowlist';
	import { openBrowserWindow } from '$lib/tauriBrowser';
	import { formatObfuscatedProxy } from '$lib/proxyDisplay';
	import { goto } from '$app/navigation';
	import { getVersion } from '@tauri-apps/api/app';
	import { invoke } from '@tauri-apps/api/core';

	let cfg = $state<ReturnType<typeof loadConfig>>(null);
	let current = $state<string | null>(null);
	let uiError = $state<string | null>(null);
	let deviceSpec = $state<{
		hostname?: string;
		username?: string;
		os?: string;
		os_version?: string;
		arch?: string;
	} | null>(null);
	let hasConnection = $state(false);
	let refreshBusy = $state(false);
	let refreshMessage = $state<string | null>(null);

	onMount(() => {
		cfg = loadConfig();
		// No built-in default sites: allowlist is fully server/admin driven.
		current = cfg?.sites?.[0] ? patternToStartUrl(cfg.sites[0].urlPattern) : null;

		const conn = loadConnection();
		hasConnection = !!conn;
		if (!conn) return;

		// Best-effort: collect richer device info from Tauri backend.
		invoke('get_device_spec')
			.then((spec) => {
				deviceSpec = spec as any;
			})
			.catch(() => {
				deviceSpec = null;
			});

		// Refresh config from server (admin may change proxy/sites after approval).
		getDeviceOptions(conn.orgId, conn.deviceId)
			.then((opt) => {
				if (opt.status === 'REJECTED' || opt.status === 'IGNORED') {
					clearConnection();
					hasConnection = false;
					goto('/auth/connect');
					return;
				}
				cfg = { proxy: opt.proxy ?? null, sites: opt.sites ?? [] };
				saveConfig(cfg);
				if (!current) current = cfg.sites?.[0] ? patternToStartUrl(cfg.sites[0].urlPattern) : null;
			})
			.catch(() => {
				// ignore; keep local config
			});

		const tick = async () => {
			try {
				const appVersion = await getVersion().catch(() => null);
				await fetch(`${SERVER_ORIGIN}/api/device/telemetry`, {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						orgId: conn.orgId,
						deviceId: conn.deviceId,
						currentUrl: current,
						spec: {
							hostname: deviceSpec?.hostname,
							username: deviceSpec?.username,
							os: deviceSpec?.os ?? navigator.platform,
							osVersion: deviceSpec?.os_version,
							arch: deviceSpec?.arch,
							appVersion: appVersion ?? undefined,
						},
						location: {}
					})
				});
			} catch {
				// ignore
			}
		};

		tick();
		const id = setInterval(tick, 10_000);
		return () => clearInterval(id);
	});

	function allowed(url: string) {
		if (!cfg) return false;
		return isAllowedPattern(url, cfg.sites.map((s) => s.urlPattern));
	}

	function patternToStartUrl(pattern: string) {
		// Allowlist patterns use '*' wildcards, but the embedded browser needs a concrete URL.
		// We only support trimming trailing wildcards for navigation purposes.
		const trimmed = pattern.replace(/\*+$/g, '');
		try {
			return new URL(trimmed).toString();
		} catch {
			return trimmed;
		}
	}

	function open(url: string) {
		uiError = null;
		if (!allowed(url)) {
			uiError = 'Blocked navigation (not in allowlist).';
			return;
		}
		current = url;
		const siteLabel =
			cfg?.sites.find((s) => patternToStartUrl(s.urlPattern) === url)?.label ??
			new URL(url).hostname.replace(/^www\./, '');
		const title = `${siteLabel} - Whitelist Browser`;

		openBrowserWindow(url, title, cfg?.proxy ?? null).catch((e) => {
			uiError = e instanceof Error ? e.message : 'Failed to open browser window';
		});
	}

	function faviconUrlForPattern(pattern: string) {
		const startUrl = patternToStartUrl(pattern);
		try {
			const u = new URL(startUrl);
			return `${u.origin}/favicon.ico`;
		} catch {
			return null;
		}
	}

	async function refreshFromServer() {
		const conn = loadConnection();
		if (!conn) {
			refreshMessage = 'Not connected.';
			return;
		}
		refreshBusy = true;
		refreshMessage = null;
		uiError = null;
		try {
			const opt = await getDeviceOptions(conn.orgId, conn.deviceId);
			if (opt.status === 'REJECTED' || opt.status === 'IGNORED') {
				clearConnection();
				hasConnection = false;
				goto('/auth/connect');
				return;
			}
			cfg = { proxy: opt.proxy ?? null, sites: opt.sites ?? [] };
			saveConfig(cfg);
			if (!current) current = cfg.sites?.[0] ? patternToStartUrl(cfg.sites[0].urlPattern) : null;
		} catch (e) {
			refreshMessage = e instanceof Error ? e.message : 'Could not refresh from server.';
		} finally {
			refreshBusy = false;
		}
	}
</script>

<div class="space-y-6">
	{#if uiError}
		<div class="alert alert-error"><span>{uiError}</span></div>
	{/if}

	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
		<div class="flex flex-wrap items-end gap-2">
			<div>
				<h1 class="text-2xl font-semibold">Allowed websites</h1>
				<p class="text-sm text-base-content/70">Pick a site to open it in the secured browser window.</p>
			</div>
			<button
				type="button"
				class="btn btn-outline btn-sm gap-1"
				onclick={() => refreshFromServer()}
				disabled={refreshBusy || !hasConnection}
				aria-busy={refreshBusy}
			>
				{#if refreshBusy}
					<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
				{/if}
				Refresh
			</button>
		</div>

		{#if cfg?.proxy}
			<div class="rounded-box bg-base-200 px-4 py-3 text-sm">
				<div class="text-xs uppercase text-base-content/60">Proxy (masked)</div>
				<div class="font-mono tracking-wide">{formatObfuscatedProxy(cfg.proxy)}</div>
				<div class="mt-1 text-xs text-base-content/50">Real endpoint is applied when opening sites.</div>
			</div>
		{/if}
	</div>

	{#if refreshMessage}
		<div class="alert alert-warning py-2 text-sm"><span>{refreshMessage}</span></div>
	{/if}

	{#if !cfg}
		<div class="card bg-base-100 shadow">
			<div class="card-body">
				<p class="text-sm text-base-content/70">No config yet. Connect first.</p>
			</div>
		</div>
	{:else if cfg.sites.length === 0}
		<div class="card bg-base-100 shadow">
			<div class="card-body">
				<p class="text-sm text-base-content/70">No allowlisted sites configured for this org.</p>
			</div>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each cfg.sites as s (s.id)}
				<button
					type="button"
					class="card bg-base-100 shadow transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40"
					onclick={() => open(patternToStartUrl(s.urlPattern))}
				>
					<div class="card-body">
						<div class="flex items-center gap-3">
							{#if faviconUrlForPattern(s.urlPattern)}
								<img
									class="h-8 w-8 rounded"
									src={faviconUrlForPattern(s.urlPattern) ?? ''}
									alt=""
									loading="lazy"
									referrerpolicy="no-referrer"
									onerror={(e) => {
										// Hide broken favicons (missing /favicon.ico, blocked, etc.)
										const img = e.currentTarget as HTMLImageElement;
										img.style.display = 'none';
									}}
								/>
							{/if}

							<div class="min-w-0 text-left">
								<div class="truncate text-lg font-semibold">{s.label}</div>
								<div class="truncate text-xs text-base-content/60">
									{(() => {
										try {
											return new URL(patternToStartUrl(s.urlPattern)).hostname.replace(/^www\./, '');
										} catch {
											return patternToStartUrl(s.urlPattern);
										}
									})()}
								</div>
							</div>
						</div>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>


<script lang="ts">
	import { onMount } from 'svelte';

	type Device = {
		id: string;
		deviceName: string;
		deviceFingerprint: string;
		lastSeenAt: string | null;
		lastIp: string | null;
		lastLocation: Record<string, unknown>;
		lastSpec: Record<string, unknown>;
		lastAppVersion: string | null;
	};

	type EventRow = { id: string; eventType: string; payload: unknown; createdAt: string };

	let { data, params } = $props<{ data: { device: Device | null; recent: EventRow[] }; params: { id: string; deviceId: string } }>();

	let device = $state<Device | null>(null);
	let recent = $state<EventRow[]>([]);
	let live = $state<'connecting' | 'connected' | 'disconnected'>('connecting');

	$effect(() => {
		device = data.device;
		recent = data.recent;
	});

	onMount(() => {
		const es = new EventSource(`/api/orgs/${params.id}/devices/${params.deviceId}/stream`);
		es.onopen = () => (live = 'connected');
		es.onerror = () => (live = 'disconnected');
		es.onmessage = (msg) => {
			try {
				const payload = JSON.parse(msg.data) as any;
				if (payload.type === 'telemetry') {
					if (device) {
						device = {
							...device,
							lastSeenAt: payload.at ?? device.lastSeenAt,
							lastIp: payload.ip ?? device.lastIp,
							lastLocation: payload.location ?? device.lastLocation,
							lastSpec: payload.spec ?? device.lastSpec,
							lastAppVersion: payload.spec?.appVersion ?? device.lastAppVersion
						};
					}
					recent = [
						{
							id: crypto.randomUUID(),
							eventType: 'telemetry',
							payload,
							createdAt: payload.at ?? new Date().toISOString()
						},
						...recent
					].slice(0, 25);
				}
			} catch {
				// ignore
			}
		};
		return () => es.close();
	});
</script>

{#if !device}
	<div class="alert alert-error"><span>Device not found.</span></div>
{:else}
	<div class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold">{device.deviceName}</h1>
			<p class="text-base-content/70 font-mono text-xs">{device.deviceFingerprint}</p>
		</div>
		<div class="flex flex-col items-end gap-2">
			<span class="badge badge-outline">Live: {live}</span>
			<a class="btn" href={`/home/${params.id}/devices`}>Back to devices</a>
		</div>
	</div>

	<div class="mt-6 grid gap-6 lg:grid-cols-2">
		<div class="card bg-base-100 shadow">
			<div class="card-body">
				<h2 class="card-title">Last seen</h2>
				<div class="text-sm">{device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : '-'}</div>
				<div class="mt-3">
					<div class="text-xs uppercase text-base-content/60">IP</div>
					<div class="font-mono text-xs">{device.lastIp ?? '-'}</div>
				</div>
				<div class="mt-3">
					<div class="text-xs uppercase text-base-content/60">App version</div>
					<div class="font-mono text-xs">{device.lastAppVersion ?? '-'}</div>
				</div>
			</div>
		</div>

		<div class="card bg-base-100 shadow">
			<div class="card-body">
				<h2 class="card-title">Location</h2>
				<pre class="mt-2 rounded-box bg-base-200 p-3 text-xs overflow-auto">{JSON.stringify(device.lastLocation ?? {}, null, 2)}</pre>
			</div>
		</div>

		<div class="card bg-base-100 shadow lg:col-span-2">
			<div class="card-body">
				<h2 class="card-title">Device specification</h2>
				<pre class="mt-2 rounded-box bg-base-200 p-3 text-xs overflow-auto">{JSON.stringify(device.lastSpec ?? {}, null, 2)}</pre>
			</div>
		</div>

		<div class="card bg-base-100 shadow lg:col-span-2">
			<div class="card-body">
				<h2 class="card-title">Recent events</h2>
				<div class="overflow-x-auto">
					<table class="table">
						<thead><tr><th>Time</th><th>Type</th><th>Payload</th></tr></thead>
						<tbody>
							{#each recent as e (e.id)}
								<tr>
									<td class="whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</td>
									<td><span class="badge badge-outline">{e.eventType}</span></td>
									<td><pre class="text-xs overflow-auto max-w-[70vw]">{JSON.stringify(e.payload, null, 2)}</pre></td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</div>
{/if}


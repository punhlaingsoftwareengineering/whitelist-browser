<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';

	type Device = {
		id: string;
		deviceName: string;
		deviceFingerprint: string;
		lastSeenAt: string | null;
		lastIp: string | null;
		lastAppVersion: string | null;
		username?: string | null;
		hostname?: string | null;
		os?: string | null;
	};

	let { data, params } = $props<{ data: { devices: Device[] }; params: { id: string } }>();
</script>

<div class="flex items-start justify-between">
	<div>
		<h1 class="text-2xl font-bold">Devices</h1>
		<p class="text-base-content/70">Only accepted devices appear here.</p>
	</div>
	<a class="btn" href={`/home/${params.id}`}>Back</a>
</div>

<div class="mt-6 overflow-x-auto rounded-box bg-base-100 shadow">
	<table class="table">
		<thead>
			<tr>
				<th>Name</th>
				<th>User</th>
				<th>Hostname</th>
				<th>OS</th>
				<th>Last seen</th>
				<th>IP</th>
				<th>App version</th>
				<th class="text-right">Actions</th>
			</tr>
		</thead>
		<tbody>
			{#if data.devices.length === 0}
				<tr><td colspan="8" class="text-base-content/70">No devices yet.</td></tr>
			{:else}
				{#each data.devices as d (d.id)}
					<tr>
						<td class="font-medium">{d.deviceName}</td>
						<td class="font-mono text-xs">{d.username ?? '-'}</td>
						<td class="font-mono text-xs">{d.hostname ?? '-'}</td>
						<td class="text-xs">{d.os ?? '-'}</td>
						<td>{d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString() : '-'}</td>
						<td class="font-mono text-xs">{d.lastIp ?? '-'}</td>
						<td class="font-mono text-xs">{d.lastAppVersion ?? '-'}</td>
						<td class="text-right">
							<a class="btn btn-sm" href={`/home/${params.id}/devices/${d.id}`}>
								Live <ArrowRight size={16} />
							</a>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>


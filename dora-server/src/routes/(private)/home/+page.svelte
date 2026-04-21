<script lang="ts">
	import { Plus, Pencil, Trash2, ArrowRight } from '@lucide/svelte';

	type Org = { id: string; name: string; createdAt: string; updatedAt: string };
	let { data } = $props<{ data: { orgs: Org[] } }>();

	let orgs = $state<Org[]>([]);
	$effect(() => {
		orgs = data.orgs ?? [];
	});
	let loading = $state(false);
	let error = $state<string | null>(null);

	let createName = $state('');
	let edit = $state<{ id: string; name: string } | null>(null);
	let deleteTarget = $state<{ id: string; name: string; confirm: string } | null>(null);

	async function refresh() {
		error = null;
		try {
			const res = await fetch('/api/orgs');
			const json = await res.json();
			if (!json.ok) throw new Error(json.error?.message ?? 'Failed to load');
			orgs = json.orgs;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Unexpected error';
		}
	}

	async function createOrg() {
		const res = await fetch('/api/orgs', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ name: createName })
		});
		const json = await res.json();
		if (!json.ok) throw new Error(json.error?.message ?? 'Create failed');
		createName = '';
		await refresh();
	}

	async function updateOrg() {
		if (!edit) return;
		const res = await fetch(`/api/orgs/${edit.id}`, {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ id: edit.id, name: edit.name })
		});
		const json = await res.json();
		if (!json.ok) throw new Error(json.error?.message ?? 'Update failed');
		edit = null;
		await refresh();
	}

	async function deleteOrg() {
		if (!deleteTarget) return;
		if (deleteTarget.confirm !== deleteTarget.name) throw new Error('Confirmation text does not match');
		const res = await fetch(`/api/orgs/${deleteTarget.id}`, { method: 'DELETE' });
		const json = await res.json();
		if (!json.ok) throw new Error(json.error?.message ?? 'Delete failed');
		deleteTarget = null;
		await refresh();
	}
</script>

<div class="flex items-start justify-between gap-4">
	<div>
		<h1 class="text-2xl font-bold">Organizations</h1>
		<p class="text-base-content/70">Create an organization and manage proxy + allowed websites.</p>
	</div>

	<button class="btn btn-primary" type="button" onclick={() => (document.getElementById('modal-create') as HTMLDialogElement).showModal()}>
		<Plus size={18} />Create
	</button>
</div>

{#if error}
	<div class="alert alert-error mt-4"><span>{error}</span></div>
{/if}

<div class="mt-6 overflow-x-auto rounded-box bg-base-100 shadow">
	<table class="table">
		<thead>
			<tr>
				<th>Name</th>
				<th>Created</th>
				<th class="text-right">Actions</th>
			</tr>
		</thead>
		<tbody>
			{#if loading}
				<tr><td colspan="3"><span class="loading loading-spinner" aria-label="Loading"></span></td></tr>
			{:else if orgs.length === 0}
				<tr><td colspan="3" class="text-base-content/70">No organizations yet.</td></tr>
			{:else}
				{#each orgs as org}
					<tr>
						<td class="font-medium">{org.name}</td>
						<td>{new Date(org.createdAt).toLocaleString()}</td>
						<td class="text-right">
							<div class="join">
								<a class="btn btn-sm join-item" href={`/home/${org.id}`}>
									Enter <ArrowRight size={16} />
								</a>
								<button
									class="btn btn-sm join-item"
									type="button"
									onclick={() => {
										edit = { id: org.id, name: org.name };
										(document.getElementById('modal-edit') as HTMLDialogElement).showModal();
									}}
								>
									<Pencil size={16} />
								</button>
								<button
									class="btn btn-sm btn-error join-item"
									type="button"
									onclick={() => {
										deleteTarget = { id: org.id, name: org.name, confirm: '' };
										(document.getElementById('modal-delete') as HTMLDialogElement).showModal();
									}}
								>
									<Trash2 size={16} />
								</button>
							</div>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<dialog id="modal-create" class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg">Create organization</h3>
		<div class="mt-3 grid gap-3">
			<label class="form-control">
				<div class="label"><span class="label-text">Name</span></div>
				<input class="input input-bordered" bind:value={createName} placeholder="Acme Inc" />
			</label>
		</div>
		<div class="modal-action">
			<form method="dialog">
				<button class="btn">Cancel</button>
			</form>
			<button class="btn btn-primary" type="button" onclick={async () => { await createOrg(); (document.getElementById('modal-create') as HTMLDialogElement).close(); }}>
				Create
			</button>
		</div>
	</div>
</dialog>

<dialog id="modal-edit" class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg">Edit organization</h3>
		{#if edit}
			<div class="mt-3 grid gap-3">
				<label class="form-control">
					<div class="label"><span class="label-text">Name</span></div>
					<input class="input input-bordered" bind:value={edit.name} />
				</label>
			</div>
		{/if}
		<div class="modal-action">
			<form method="dialog">
				<button class="btn">Cancel</button>
			</form>
			<button class="btn btn-primary" type="button" onclick={async () => { await updateOrg(); (document.getElementById('modal-edit') as HTMLDialogElement).close(); }}>
				Save
			</button>
		</div>
	</div>
</dialog>

<dialog id="modal-delete" class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg">Delete organization</h3>
		{#if deleteTarget}
			<p class="mt-2 text-sm text-base-content/70">
				To confirm, type <span class="font-semibold">{deleteTarget.name}</span>.
			</p>
			<label class="form-control mt-3">
				<input class="input input-bordered" bind:value={deleteTarget.confirm} />
			</label>
		{/if}
		<div class="modal-action">
			<form method="dialog">
				<button class="btn">Cancel</button>
			</form>
			<button class="btn btn-error" type="button" onclick={async () => { await deleteOrg(); (document.getElementById('modal-delete') as HTMLDialogElement).close(); }}>
				Delete
			</button>
		</div>
	</div>
</dialog>


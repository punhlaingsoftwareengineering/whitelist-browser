<script lang="ts">
	import { ArrowLeft, Home, KeyRound } from '@lucide/svelte';
	let { data }: { data: { message?: string; token?: string } } = $props();

	let token = $state('');
	$effect(() => {
		token = data?.token ?? '';
	});
</script>

<div class="card bg-base-100 shadow">
	<div class="card-body gap-4">
		<div class="flex items-center justify-between">
			<h1 class="card-title text-2xl">Reset password</h1>
			<div class="join">
				<button class="btn btn-ghost join-item" type="button" onclick={() => history.back()}>
					<ArrowLeft size={18} />
				</button>
				<a class="btn btn-ghost join-item" href="/onboarding">
					<Home size={18} />
				</a>
			</div>
		</div>

		{#if data?.message}
			<div class="alert alert-error"><span>{data.message}</span></div>
		{/if}

		<form method="POST" class="grid gap-3">
			<label class="form-control">
				<div class="label"><span class="label-text">Reset token</span></div>
				<input class="input input-bordered" name="token" bind:value={token} required />
				<div class="label">
					<span class="label-text-alt">Paste the token from the reset link.</span>
				</div>
			</label>
			<label class="form-control">
				<div class="label"><span class="label-text">New password</span></div>
				<input class="input input-bordered" name="newPassword" type="password" autocomplete="new-password" required />
			</label>
			<label class="form-control">
				<div class="label"><span class="label-text">Confirm new password</span></div>
				<input class="input input-bordered" name="newPasswordConfirm" type="password" autocomplete="new-password" required />
			</label>
			<button class="btn btn-primary" type="submit" formaction="?/reset">
				<KeyRound size={18} />
				Set new password
			</button>
		</form>

		<div class="text-sm">
			<a class="link link-hover" href="/auth/login">Back to login</a>
		</div>
	</div>
</div>


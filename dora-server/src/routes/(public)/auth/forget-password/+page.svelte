<script lang="ts">
	import { ArrowLeft, Home, Mail } from '@lucide/svelte';
	let { data }: { data: { message?: string; success?: string } } = $props();
</script>

<div class="card bg-base-100 shadow">
	<div class="card-body gap-4">
		<div class="flex items-center justify-between">
			<h1 class="card-title text-2xl">Forgot password</h1>
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
		{#if data?.success}
			<div class="alert alert-success"><span>{data.success}</span></div>
		{/if}

		<form method="POST" class="grid gap-3">
			<label class="form-control">
				<div class="label"><span class="label-text">Email</span></div>
				<input class="input input-bordered" name="email" type="email" autocomplete="email" required />
			</label>
			<button class="btn btn-primary" type="submit" formaction="?/requestReset">
				<Mail size={18} />
				Send reset link
			</button>
		</form>

		<div class="text-sm">
			<a class="link link-hover" href="/auth/login">Back to login</a>
		</div>
	</div>
</div>


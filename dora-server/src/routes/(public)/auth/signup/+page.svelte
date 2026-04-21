<script lang="ts">
	import { ArrowLeft, Home } from '@lucide/svelte';
	type SignupView = { message?: string; stage?: 'REQUEST' | 'VERIFY'; token?: string; email?: string };
	let { data, form }: { data: SignupView; form: SignupView | null } = $props();

	let view = $derived<SignupView>(form ?? data ?? {});

	let stage = $derived<'REQUEST' | 'VERIFY'>(view.stage ?? 'REQUEST');
	let token = $state('');

	$effect(() => {
		token = view.token ?? '';
	});
</script>

<div class="card bg-base-100 shadow">
	<div class="card-body gap-4">
		<div class="flex items-center justify-between">
			<h1 class="card-title text-2xl">Sign up</h1>
			<div class="join">
				<button class="btn btn-ghost join-item" type="button" onclick={() => history.back()}>
					<ArrowLeft size={18} />
				</button>
				<a class="btn btn-ghost join-item" href="/onboarding">
					<Home size={18} />
				</a>
			</div>
		</div>

		{#if view?.message}
			<div class="alert alert-error">
				<span>{view.message}</span>
			</div>
		{/if}

		{#if stage === 'REQUEST'}
			<form method="POST" class="grid gap-3">
				<label class="form-control">
					<div class="label"><span class="label-text">Name</span></div>
					<input class="input input-bordered" name="name" required />
				</label>
				<label class="form-control">
					<div class="label"><span class="label-text">Email</span></div>
					<input class="input input-bordered" name="email" type="email" autocomplete="email" required />
				</label>
				<label class="form-control">
					<div class="label"><span class="label-text">Password</span></div>
					<input class="input input-bordered" name="password" type="password" autocomplete="new-password" required />
				</label>
				<label class="form-control">
					<div class="label"><span class="label-text">Confirm password</span></div>
					<input class="input input-bordered" name="passwordConfirm" type="password" autocomplete="new-password" required />
				</label>
				<button class="btn btn-primary" type="submit" formaction="?/requestOtp">Send OTP</button>
			</form>
		{:else}
			<form method="POST" class="grid gap-3">
				<input type="hidden" name="token" value={token} />
				<label class="form-control">
					<div class="label"><span class="label-text">OTP code</span></div>
					<input class="input input-bordered tracking-widest" name="otp" inputmode="numeric" minlength="6" maxlength="6" required />
					<div class="label"><span class="label-text-alt">We sent a 6-digit OTP to {view.email}</span></div>
				</label>
				<button class="btn btn-primary" type="submit" formaction="?/verifyOtp">Verify & create account</button>
			</form>
		{/if}

		<div class="flex flex-wrap items-center justify-between gap-2 text-sm">
			<a class="link link-hover" href="/auth/login">Already have an account? Login</a>
			<a class="link link-hover" href="/auth/forget-password">Forgot password?</a>
		</div>
	</div>
</div>


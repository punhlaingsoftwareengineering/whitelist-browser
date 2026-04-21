<script lang="ts">
	import { ArrowLeft, Home, Github } from '@lucide/svelte';
	let { data }: { data: { message?: string } } = $props();
</script>

<div class="card bg-base-100 shadow">
	<div class="card-body gap-4">
		<div class="flex items-center justify-between">
			<h1 class="card-title text-2xl">Login</h1>
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
			<div class="alert alert-error">
				<span>{data.message}</span>
			</div>
		{/if}

		<form method="POST" class="grid gap-3">
			<label class="form-control">
				<div class="label"><span class="label-text">Email</span></div>
				<input class="input input-bordered" name="email" type="email" autocomplete="email" required />
			</label>
			<label class="form-control">
				<div class="label"><span class="label-text">Password</span></div>
				<input class="input input-bordered" name="password" type="password" autocomplete="current-password" required />
			</label>
			<button class="btn btn-primary" type="submit" formaction="?/signInEmail">Continue</button>
		</form>

		<div class="divider">or</div>

		<form method="POST" class="grid gap-2">
			<input type="hidden" name="provider" value="github" />
			<input type="hidden" name="callbackURL" value="/home" />
			<button class="btn btn-outline" type="submit" formaction="?/signInSocial">
				<Github size={18} />
				Continue with GitHub
			</button>
		</form>

		<div class="flex flex-wrap items-center justify-between gap-2 text-sm">
			<a class="link link-hover" href="/auth/signup">Don’t have an account? Sign up</a>
			<a class="link link-hover" href="/auth/forget-password">Forgot password?</a>
		</div>
	</div>
</div>


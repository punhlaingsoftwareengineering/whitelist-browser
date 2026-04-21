<script lang="ts">
	import { ShieldCheck, Globe, Network } from '@lucide/svelte';
	import LogoMark from '$lib/ui/LogoMark.svelte';
</script>

<section class="mx-auto max-w-6xl px-6 py-12">
	<div class="hero rounded-box bg-base-200">
		<div class="hero-content flex-col gap-10 lg:flex-row">
			<div class="max-w-xl">
				<div class="mb-4 flex items-center gap-3">
					<LogoMark size={48} class="shrink-0" />
					<span class="text-sm font-semibold uppercase tracking-wide text-base-content/60">Whitelist Browser</span>
				</div>
				<h1 class="text-4xl font-bold leading-tight">Whitelist-only browsing for your organization.</h1>
				<p class="py-6 text-base-content/80">
					Control which websites are accessible, enforce proxy settings, and approve devices before they can
					connect — all from a simple admin dashboard.
				</p>
				<div class="flex flex-wrap gap-3">
					<a class="btn btn-primary" href="/auth/signup">Get started</a>
					<a class="btn btn-ghost" href="/auth/login">I already have an account</a>
				</div>
			</div>

			<div class="grid w-full gap-4 sm:grid-cols-3">
				<div class="card bg-base-100 shadow">
					<div class="card-body">
						<div class="flex items-center gap-2">
							<ShieldCheck size={18} />
							<h2 class="card-title text-base">Device approval</h2>
						</div>
						<p class="text-sm text-base-content/70">Approve, reject, or ignore desktop device requests.</p>
					</div>
				</div>
				<div class="card bg-base-100 shadow">
					<div class="card-body">
						<div class="flex items-center gap-2">
							<Network size={18} />
							<h2 class="card-title text-base">Proxy controls</h2>
						</div>
						<p class="text-sm text-base-content/70">Set a per-organization proxy host + port.</p>
					</div>
				</div>
				<div class="card bg-base-100 shadow">
					<div class="card-body">
						<div class="flex items-center gap-2">
							<Globe size={18} />
							<h2 class="card-title text-base">Allowlisted websites</h2>
						</div>
						<p class="text-sm text-base-content/70">Only allow the exact sites your users need.</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div id="features" class="mt-12 grid gap-6 lg:grid-cols-3">
		<div class="card bg-base-100 shadow">
			<div class="card-body">
				<h3 class="card-title">Simple admin workflow</h3>
				<p class="text-sm text-base-content/70">Create orgs, rotate secrets, manage proxy + allowed sites.</p>
			</div>
		</div>
		<div class="card bg-base-100 shadow">
			<div class="card-body">
				<h3 class="card-title">Secure by default</h3>
				<p class="text-sm text-base-content/70">
					Desktop devices must be approved before receiving config or browsing access.
				</p>
			</div>
		</div>
		<div class="card bg-base-100 shadow">
			<div class="card-body">
				<h3 class="card-title">Auditable</h3>
				<p class="text-sm text-base-content/70">Track device “last seen” and basic usage events.</p>
			</div>
		</div>
	</div>
</section>


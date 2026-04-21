<script lang="ts">
	import { goto } from '$app/navigation';
	import { Palette, LogIn, UserPlus } from '@lucide/svelte';
	import { page } from '$app/state';
	import LogoMark from '$lib/ui/LogoMark.svelte';

	const links = [
		{ href: '/onboarding', label: 'Home' },
		{ href: '/onboarding#features', label: 'Features' },
		{ href: '/onboarding#pricing', label: 'Pricing' }
	] as const;

	function toggleTheme() {
		const root = document.querySelector<HTMLElement>('[data-theme]');
		if (!root) return;
		root.dataset.theme = root.dataset.theme === 'cupcake' ? 'dark' : 'cupcake';
	}
</script>

<div class="navbar bg-base-100">
	<div class="navbar-start">
		<button class="btn btn-ghost gap-2 text-xl" onclick={() => goto('/onboarding')}>
			<LogoMark size={28} class="shrink-0" />
			<span>Whitelist Browser</span>
		</button>
	</div>

	<div class="navbar-center hidden lg:flex">
		<ul class="menu menu-horizontal px-1">
			{#each links as l}
				<li>
					<a class={page.url.pathname.startsWith('/onboarding') ? 'active' : ''} href={l.href}>{l.label}</a>
				</li>
			{/each}
		</ul>
	</div>

	<div class="navbar-end gap-2">
		<button class="btn btn-ghost btn-square" type="button" onclick={toggleTheme} aria-label="Toggle theme">
			<Palette size={18} />
		</button>

		<a class="btn btn-ghost" href="/auth/login">
			<LogIn size={18} />
			<span class="hidden sm:inline">Login</span>
		</a>
		<a class="btn btn-primary" href="/auth/signup">
			<UserPlus size={18} />
			<span class="hidden sm:inline">Sign up</span>
		</a>
	</div>
</div>


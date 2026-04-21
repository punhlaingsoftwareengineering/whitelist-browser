import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle } from '@sveltejs/kit';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	const isDeviceApi = event.url.pathname.startsWith('/api/device/');
	const origin = event.request.headers.get('origin');

	const corsHeaders = isDeviceApi
		? new Headers({
				'access-control-allow-origin': origin ?? '*',
				'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
				'access-control-allow-headers': 'content-type, authorization',
				vary: origin ? 'Origin' : ''
			})
		: null;

	// Handle preflight requests explicitly, otherwise SvelteKit returns 405
	// when the route doesn't export OPTIONS.
	if (isDeviceApi && event.request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: corsHeaders ?? undefined
		});
	}

	const response = await svelteKitHandler({ event, resolve, auth, building });

	if (corsHeaders) {
		for (const [k, v] of corsHeaders.entries()) {
			if (v) response.headers.set(k, v);
		}
	}

	return response;
};

export const handle: Handle = sequence(handleBetterAuth);

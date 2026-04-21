import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';

export const load: PageServerLoad = (event) => {
	if (event.locals.user) {
		return redirect(302, '/home');
	}
	return {};
};

export const actions: Actions = {
	signInEmail: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';

		try {
			await auth.api.signInEmail({
				body: { email, password, callbackURL: '/home' },
				headers: event.request.headers
			});
		} catch (error) {
			if (error instanceof APIError) return fail(400, { message: error.message || 'Signin failed' });
			return fail(500, { message: 'Unexpected error' });
		}

		return redirect(302, '/home');
	},

	signInSocial: async (event) => {
		const formData = await event.request.formData();
		const provider = formData.get('provider')?.toString() ?? 'github';
		const callbackURL = formData.get('callbackURL')?.toString() ?? '/home';

		const result = await auth.api.signInSocial({
			body: { provider: provider as 'github', callbackURL }
		});

		if (result.url) return redirect(302, result.url);
		return fail(400, { message: 'Social sign-in failed' });
	}
};


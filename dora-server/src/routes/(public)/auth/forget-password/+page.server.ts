import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';

export const load: PageServerLoad = () => ({});

export const actions: Actions = {
	requestReset: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';

		try {
			await auth.api.requestPasswordReset({
				body: { email, redirectTo: '/auth/reset-password' },
				headers: event.request.headers
			});
		} catch (error) {
			if (error instanceof APIError) return fail(400, { message: error.message || 'Request failed' });
			return fail(500, { message: 'Unexpected error' });
		}

		return { success: 'If that email exists, a reset link has been sent.' };
	}
};


import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';

export const load: PageServerLoad = (event) => {
	const token = event.url.searchParams.get('token') ?? '';
	return { token };
};

export const actions: Actions = {
	reset: async (event) => {
		const formData = await event.request.formData();
		const token = formData.get('token')?.toString() ?? '';
		const newPassword = formData.get('newPassword')?.toString() ?? '';
		const newPasswordConfirm = formData.get('newPasswordConfirm')?.toString() ?? '';

		if (newPassword !== newPasswordConfirm) return fail(400, { message: 'Passwords do not match' });

		try {
			await auth.api.resetPassword({
				body: { newPassword, token },
				headers: event.request.headers
			});
		} catch (error) {
			if (error instanceof APIError) return fail(400, { message: error.message || 'Reset failed' });
			return fail(500, { message: 'Unexpected error' });
		}

		return { token: '', message: undefined };
	}
};


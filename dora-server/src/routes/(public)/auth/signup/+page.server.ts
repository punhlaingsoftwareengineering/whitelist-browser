import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSignupOtp, verifySignupOtp } from '$lib/server/otp/signup';
import { sendMail } from '$lib/server/email';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';

export const load: PageServerLoad = (event) => {
	if (event.locals.user) {
		return redirect(302, '/home');
	}
	return { stage: 'REQUEST' as const };
};

export const actions: Actions = {
	requestOtp: async (event) => {
		const formData = await event.request.formData();
		const name = formData.get('name')?.toString() ?? '';
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const passwordConfirm = formData.get('passwordConfirm')?.toString() ?? '';

		if (password !== passwordConfirm) return fail(400, { message: 'Passwords do not match' });

		const { token, otp } = createSignupOtp({ email, name, password });

		await sendMail({
			to: email,
			subject: 'Your Dora OTP code',
			text: `Your OTP code is: ${otp}`,
			html: `<p>Your OTP code is:</p><p style="font-size:24px; font-weight:700; letter-spacing:0.25em">${otp}</p>`
		});

		return { stage: 'VERIFY' as const, token, email };
	},

	verifyOtp: async (event) => {
		const formData = await event.request.formData();
		const token = formData.get('token')?.toString() ?? '';
		const otp = (formData.get('otp')?.toString() ?? '').replace(/\s+/g, '');

		const result = verifySignupOtp(token, otp);
		if (!result.ok) return fail(400, { message: result.error === 'OTP_EXPIRED' ? 'OTP expired' : 'Invalid OTP' });

		try {
			await auth.api.signUpEmail({
				body: {
					email: result.data.email,
					password: result.data.password,
					name: result.data.name,
					callbackURL: '/home'
				}
			});
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('[signup] verifyOtp failed', error);

			// `instanceof` can fail across module boundaries; also handle unknown thrown values.
			const message =
				error instanceof APIError
					? error.message
					: typeof error === 'object' && error && 'message' in error
						? String((error as { message?: unknown }).message)
						: null;

			if (message) return fail(400, { message });
			return fail(500, { message: 'Unexpected error' });
		}

		return redirect(302, '/home');
	}
};


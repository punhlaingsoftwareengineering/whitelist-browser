import crypto from 'node:crypto';

type PendingSignup = {
	email: string;
	name: string;
	password: string;
	otp: string;
	expiresAt: number;
};

const PENDING = new Map<string, PendingSignup>();
const TTL_MS = 10 * 60 * 1000;

function cleanup() {
	const now = Date.now();
	for (const [token, value] of PENDING.entries()) {
		if (value.expiresAt <= now) PENDING.delete(token);
	}
}

export function createSignupOtp(payload: { email: string; name: string; password: string }) {
	cleanup();
	const otp = crypto.randomInt(100_000, 999_999).toString();
	const token = crypto.randomBytes(32).toString('hex');
	const expiresAt = Date.now() + TTL_MS;

	PENDING.set(token, { ...payload, otp, expiresAt });

	return { token, otp, expiresAt };
}

export function verifySignupOtp(token: string, otp: string) {
	cleanup();
	const pending = PENDING.get(token);
	if (!pending) return { ok: false as const, error: 'OTP_EXPIRED' as const };
	if (pending.otp !== otp) return { ok: false as const, error: 'OTP_INVALID' as const };

	PENDING.delete(token);
	return { ok: true as const, data: pending };
}


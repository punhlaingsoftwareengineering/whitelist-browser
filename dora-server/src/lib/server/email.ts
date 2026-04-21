import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

type SendMailInput = {
	to: string;
	subject: string;
	html: string;
	text?: string;
};

function getTransport() {
	const host = env.SMTP_HOST;
	const port = env.SMTP_PORT ? Number(env.SMTP_PORT) : undefined;
	const user = env.SMTP_USER;
	const pass = env.SMTP_PASS;

	if (!host || !port || !user || !pass) return null;

	return nodemailer.createTransport({
		host,
		port,
		secure: port === 465,
		auth: { user, pass }
	});
}

export async function sendMail(input: SendMailInput) {
	const from = env.SMTP_FROM ?? env.SMTP_USER ?? 'no-reply@localhost';
	const transport = getTransport();

	if (!transport) {
		// eslint-disable-next-line no-console
		console.warn('[email] SMTP not configured; skipping send', { to: input.to, subject: input.subject });
		// eslint-disable-next-line no-console
		console.info('[email] body:', input.text ?? input.html);
		return;
	}

	await transport.sendMail({
		from,
		to: input.to,
		subject: input.subject,
		text: input.text,
		html: input.html
	});
}


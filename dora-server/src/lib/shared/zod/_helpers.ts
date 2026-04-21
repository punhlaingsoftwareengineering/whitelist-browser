import { z } from 'zod';

export class ZodParseError extends Error {
	readonly issues: z.ZodIssue[];

	constructor(message: string, issues: z.ZodIssue[]) {
		super(message);
		this.name = 'ZodParseError';
		this.issues = issues;
	}
}

export function createZodSchema<T extends z.ZodTypeAny>(schema: T) {
	return schema;
}

export function parseOrThrow<T extends z.ZodTypeAny>(schema: T, input: unknown) {
	const result = schema.safeParse(input);
	if (!result.success) {
		throw new ZodParseError('Invalid payload', result.error.issues);
	}
	return result.data as z.infer<T>;
}

export function jsonOk(data: unknown, init?: ResponseInit) {
	return new Response(JSON.stringify(data), {
		...init,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			...(init?.headers ?? {})
		}
	});
}

export function jsonError(
	status: number,
	message: string,
	details?: unknown,
	init?: Omit<ResponseInit, 'status'>
) {
	return jsonOk(
		{
			ok: false,
			error: { message, details }
		},
		{ ...init, status }
	);
}


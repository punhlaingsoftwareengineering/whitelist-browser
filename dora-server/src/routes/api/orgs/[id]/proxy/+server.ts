import type { RequestHandler } from './$types';
import { jsonError, jsonOk, parseOrThrow } from '$lib/shared/zod/_helpers';
import { ZProxyUpsertInput } from '$lib/shared/zod/org';
import { deleteProxy, upsertProxy } from '$lib/server/remote/main/proxy';

export const PUT: RequestHandler = async (event) => {
	if (!event.locals.user) return jsonError(401, 'Unauthorized');
	const body = await event.request.json().catch(() => null);
	const input = parseOrThrow(ZProxyUpsertInput, body);
	if (input.orgId !== event.params.id) return jsonError(400, 'Invalid org id');
	const proxy = await upsertProxy(event.locals.user, input);
	if (!proxy) return jsonError(404, 'Not found');
	return jsonOk({ ok: true, proxy });
};

export const DELETE: RequestHandler = async (event) => {
	if (!event.locals.user) return jsonError(401, 'Unauthorized');
	const proxy = await deleteProxy(event.locals.user, event.params.id);
	if (!proxy) return jsonError(404, 'Not found');
	return jsonOk({ ok: true });
};


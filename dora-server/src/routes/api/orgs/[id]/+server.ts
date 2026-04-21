import type { RequestHandler } from './$types';
import { jsonError, jsonOk, parseOrThrow } from '$lib/shared/zod/_helpers';
import { ZOrgUpdateInput } from '$lib/shared/zod/org';
import { deleteOrg, updateOrg } from '$lib/server/remote/main/org';
import { getOrgDetail } from '$lib/server/remote/main/org_detail';

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user) return jsonError(401, 'Unauthorized');
	const detail = await getOrgDetail(event.locals.user, event.params.id);
	if (!detail) return jsonError(404, 'Not found');
	return jsonOk({ ok: true, ...detail });
};

export const PUT: RequestHandler = async (event) => {
	if (!event.locals.user) return jsonError(401, 'Unauthorized');
	const body = await event.request.json().catch(() => null);
	const input = parseOrThrow(ZOrgUpdateInput, body);
	if (input.id !== event.params.id) return jsonError(400, 'Invalid org id');
	const org = await updateOrg(event.locals.user, input);
	if (!org) return jsonError(404, 'Not found');
	return jsonOk({ ok: true, org });
};

export const DELETE: RequestHandler = async (event) => {
	if (!event.locals.user) return jsonError(401, 'Unauthorized');
	const org = await deleteOrg(event.locals.user, event.params.id);
	if (!org) return jsonError(404, 'Not found');
	return jsonOk({ ok: true });
};


import type { RequestHandler } from './$types';
import { jsonError, jsonOk, parseOrThrow } from '$lib/shared/zod/_helpers';
import { ZSiteUpdateInput } from '$lib/shared/zod/org';
import { deleteSite, updateSite } from '$lib/server/remote/main/site';

export const PUT: RequestHandler = async (event) => {
	if (!event.locals.user) return jsonError(401, 'Unauthorized');
	const body = await event.request.json().catch(() => null);
	const input = parseOrThrow(ZSiteUpdateInput, body);
	if (input.orgId !== event.params.id || input.id !== event.params.siteId) return jsonError(400, 'Invalid ids');
	const site = await updateSite(event.locals.user, input);
	if (!site) return jsonError(404, 'Not found');
	return jsonOk({ ok: true, site });
};

export const DELETE: RequestHandler = async (event) => {
	if (!event.locals.user) return jsonError(401, 'Unauthorized');
	const site = await deleteSite(event.locals.user, { id: event.params.siteId, orgId: event.params.id });
	if (!site) return jsonError(404, 'Not found');
	return jsonOk({ ok: true });
};


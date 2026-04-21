import type { RequestHandler } from './$types';
import { jsonError, jsonOk, parseOrThrow } from '$lib/shared/zod/_helpers';
import { ZSiteCreateInput } from '$lib/shared/zod/org';
import { createSite, listSites } from '$lib/server/remote/main/site';

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user) return jsonError(401, 'Unauthorized');
	const sites = await listSites(event.locals.user, event.params.id)();
	if (!sites) return jsonError(404, 'Not found');
	return jsonOk({ ok: true, sites });
};

export const POST: RequestHandler = async (event) => {
	if (!event.locals.user) return jsonError(401, 'Unauthorized');
	const body = await event.request.json().catch(() => null);
	const input = parseOrThrow(ZSiteCreateInput, body);
	if (input.orgId !== event.params.id) return jsonError(400, 'Invalid org id');
	const site = await createSite(event.locals.user, input);
	if (!site) return jsonError(404, 'Not found');
	return jsonOk({ ok: true, site });
};


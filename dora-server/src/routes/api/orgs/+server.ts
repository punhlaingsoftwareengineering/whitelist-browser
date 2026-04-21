import type { RequestHandler } from './$types';
import { jsonError, jsonOk, parseOrThrow } from '$lib/shared/zod/_helpers';
import { ZOrgCreateInput } from '$lib/shared/zod/org';
import { createOrg, listOrgs } from '$lib/server/remote/main/org';

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user) return jsonError(401, 'Unauthorized');
	const orgs = await listOrgs(event.locals.user)();
	return jsonOk({ ok: true, orgs });
};

export const POST: RequestHandler = async (event) => {
	if (!event.locals.user) return jsonError(401, 'Unauthorized');
	const body = await event.request.json().catch(() => null);
	const input = parseOrThrow(ZOrgCreateInput, body);
	const org = await createOrg(event.locals.user, input);
	return jsonOk({ ok: true, org });
};


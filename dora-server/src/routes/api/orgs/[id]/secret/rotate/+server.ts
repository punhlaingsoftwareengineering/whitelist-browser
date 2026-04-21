import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/shared/zod/_helpers';
import { rotateOrgSecret } from '$lib/server/remote/main/secret';

export const POST: RequestHandler = async (event) => {
	if (!event.locals.user) return jsonError(401, 'Unauthorized');
	const result = await rotateOrgSecret(event.locals.user, event.params.id);
	if (!result) return jsonError(404, 'Not found');

	return jsonOk({
		ok: true,
		orgName: result.orgName,
		secretKey: result.secretKey,
		secretId: result.row.id
	});
};


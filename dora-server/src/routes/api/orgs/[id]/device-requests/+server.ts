import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/shared/zod/_helpers';
import { db } from '$lib/server/db';
import { main_org, main_device_request, master_status } from '$lib/server/db/schema';
import { and, desc, eq } from 'drizzle-orm';

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user) return jsonError(401, 'Unauthorized');

	const org = await db.query.main_org.findFirst({
		where: and(eq(main_org.id, event.params.id), eq(main_org.ownerUserId, event.locals.user.id))
	});
	if (!org) return jsonError(404, 'Not found');

	const rows = await db.query.main_device_request.findMany({
		where: eq(main_device_request.orgId, event.params.id),
		orderBy: desc(main_device_request.requestedAt)
	});

	const statusById = new Map<string, string>();
	const uniqueStatusIds = Array.from(new Set(rows.map((r) => r.requestStatusId)));
	for (const id of uniqueStatusIds) {
		const s = await db.query.master_status.findFirst({ where: eq(master_status.id, id) });
		if (s) statusById.set(id, s.code);
	}

	return jsonOk({
		ok: true,
		requests: rows.map((r) => ({
			id: r.id,
			deviceFingerprint: r.deviceFingerprint,
			devicePublicInfo: r.devicePublicInfo,
			requestedAt: r.requestedAt,
			status: statusById.get(r.requestStatusId) ?? 'PENDING',
			deviceName: r.deviceName
		}))
	});
};


import type { RequestHandler } from './$types';
import { jsonError, jsonOk, parseOrThrow } from '$lib/shared/zod/_helpers';
import { ZDesktopConnectHello } from '$lib/shared/zod/device';
import { db } from '$lib/server/db';
import { main_org_secret, main_device_request } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { sha256Hex } from '$lib/server/crypto';
import { getMasterStatusId } from '$lib/server/status';
import { hub } from '$lib/server/ws/hub';

export const POST: RequestHandler = async (event) => {
	const body = await event.request.json().catch(() => null);
	const input = parseOrThrow(ZDesktopConnectHello, body);

	const secretHash = sha256Hex(input.secretKey);
	const secret = await db.query.main_org_secret.findFirst({
		where: and(eq(main_org_secret.orgNameCurrent, input.orgName), eq(main_org_secret.isActive, true))
	});
	if (!secret || secret.secretKeyHash !== secretHash) return jsonError(401, 'Invalid organization key');

	const pendingId = await getMasterStatusId('PENDING');
	const activeId = await getMasterStatusId('ACTIVE');

	const [req] = await db
		.insert(main_device_request)
		.values({
			orgId: secret.orgId,
			requestStatusId: pendingId,
			deviceFingerprint: input.deviceFingerprint,
			devicePublicInfo: input.deviceInfo,
			masterStatusId: activeId
		})
		.onConflictDoUpdate({
			target: [main_device_request.orgId, main_device_request.deviceFingerprint],
			set: {
				requestStatusId: pendingId,
				devicePublicInfo: input.deviceInfo,
				requestedAt: new Date(),
				decidedAt: null,
				decidedByUserId: null,
				deviceName: null
			}
		})
		.returning();

	hub.emitOrg(secret.orgId, { type: 'device_request_created', requestId: req.id });

	return jsonOk({
		ok: true,
		requestId: req.id,
		orgId: secret.orgId
	});
};


import type { RequestHandler } from './$types';
import { jsonError, jsonOk, parseOrThrow } from '$lib/shared/zod/_helpers';
import { ZDeviceRequestDecisionInput } from '$lib/shared/zod/device';
import { db } from '$lib/server/db';
import { main_org, main_device_request, main_device, master_status } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { getMasterStatusId } from '$lib/server/status';
import { hub } from '$lib/server/ws/hub';

export const POST: RequestHandler = async (event) => {
	if (!event.locals.user) return jsonError(401, 'Unauthorized');

	const org = await db.query.main_org.findFirst({
		where: and(eq(main_org.id, event.params.id), eq(main_org.ownerUserId, event.locals.user.id))
	});
	if (!org) return jsonError(404, 'Not found');

	const body = await event.request.json().catch(() => null);
	const input = parseOrThrow(ZDeviceRequestDecisionInput, body);

	const req = await db.query.main_device_request.findFirst({
		where: and(eq(main_device_request.id, input.requestId), eq(main_device_request.orgId, event.params.id))
	});
	if (!req) return jsonError(404, 'Request not found');

	const activeId = await getMasterStatusId('ACTIVE');
	const decidedAt = new Date();

	if (input.decision === 'APPROVE') {
		if (!input.deviceName) return jsonError(400, 'deviceName is required for approve');
		const approvedId = await getMasterStatusId('APPROVED');

		// upsert device
		const [device] = await db
			.insert(main_device)
			.values({
				orgId: event.params.id,
				deviceName: input.deviceName,
				deviceFingerprint: req.deviceFingerprint,
				lastSeenAt: decidedAt,
				masterStatusId: activeId
			})
			.onConflictDoUpdate({
				target: [main_device.orgId, main_device.deviceFingerprint],
				set: { deviceName: input.deviceName, lastSeenAt: decidedAt, masterStatusId: activeId }
			})
			.returning();

		await db
			.update(main_device_request)
			.set({
				requestStatusId: approvedId,
				decidedAt,
				decidedByUserId: event.locals.user.id,
				deviceName: input.deviceName,
				masterStatusId: activeId
			})
			.where(eq(main_device_request.id, req.id));

		hub.emitRequest(req.id, { type: 'device_request_decided', status: 'APPROVED', deviceId: device.id });
		hub.emitOrg(event.params.id, { type: 'device_request_decided', requestId: req.id, status: 'APPROVED' });
		return jsonOk({ ok: true });
	}

	if (input.decision === 'REJECT') {
		const rejectedId = await getMasterStatusId('REJECTED');
		await db
			.update(main_device_request)
			.set({
				requestStatusId: rejectedId,
				decidedAt,
				decidedByUserId: event.locals.user.id,
				masterStatusId: activeId
			})
			.where(eq(main_device_request.id, req.id));

		hub.emitRequest(req.id, { type: 'device_request_decided', status: 'REJECTED' });
		hub.emitOrg(event.params.id, { type: 'device_request_decided', requestId: req.id, status: 'REJECTED' });
		return jsonOk({ ok: true });
	}

	// IGNORE
	const ignoredId = await getMasterStatusId('IGNORED');
	await db
		.update(main_device_request)
		.set({
			requestStatusId: ignoredId,
			decidedAt,
			decidedByUserId: event.locals.user.id,
			masterStatusId: activeId
		})
		.where(eq(main_device_request.id, req.id));

	hub.emitRequest(req.id, { type: 'device_request_decided', status: 'IGNORED' });
	hub.emitOrg(event.params.id, { type: 'device_request_decided', requestId: req.id, status: 'IGNORED' });
	return jsonOk({ ok: true });
};


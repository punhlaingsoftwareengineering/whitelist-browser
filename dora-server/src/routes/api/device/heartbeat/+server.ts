import type { RequestHandler } from './$types';
import { jsonError, jsonOk, parseOrThrow } from '$lib/shared/zod/_helpers';
import { ZDeviceHeartbeatInput } from '$lib/shared/zod/device';
import { db } from '$lib/server/db';
import { main_device, main_device_event } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

export const POST: RequestHandler = async (event) => {
	const body = await event.request.json().catch(() => null);
	const input = parseOrThrow(ZDeviceHeartbeatInput, body);

	const device = await db.query.main_device.findFirst({
		where: and(eq(main_device.id, input.deviceId), eq(main_device.orgId, input.orgId))
	});
	if (!device) return jsonError(404, 'Device not found');

	const now = new Date();
	await db.update(main_device).set({ lastSeenAt: now }).where(eq(main_device.id, input.deviceId));

	await db.insert(main_device_event).values({
		deviceId: input.deviceId,
		eventType: 'heartbeat',
		payload: { currentUrl: input.currentUrl ?? null }
	});

	return jsonOk({ ok: true });
};


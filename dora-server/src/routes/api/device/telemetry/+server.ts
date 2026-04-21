import type { RequestHandler } from './$types';
import { jsonError, jsonOk, parseOrThrow } from '$lib/shared/zod/_helpers';
import { ZDeviceTelemetryInput } from '$lib/shared/zod/device_telemetry';
import { db } from '$lib/server/db';
import { main_device, main_device_event } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { hub } from '$lib/server/ws/hub';

function getIp(req: Request) {
	return (
		req.headers.get('cf-connecting-ip') ??
		req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
		req.headers.get('x-real-ip') ??
		null
	);
}

export const POST: RequestHandler = async (event) => {
	const body = await event.request.json().catch(() => null);
	let input: (typeof ZDeviceTelemetryInput)['_output'];
	try {
		input = parseOrThrow(ZDeviceTelemetryInput, body);
	} catch (e) {
		return jsonError(400, e instanceof Error ? e.message : 'Invalid payload');
	}

	const device = await db.query.main_device.findFirst({
		where: and(eq(main_device.id, input.deviceId), eq(main_device.orgId, input.orgId))
	});
	if (!device) return jsonError(404, 'Device not found');

	const ip = getIp(event.request);
	const now = new Date();

	await db
		.update(main_device)
		.set({
			lastSeenAt: now,
			lastIp: ip,
			lastLocation: input.location,
			lastSpec: input.spec,
			lastAppVersion: input.spec.appVersion ?? device.lastAppVersion
		})
		.where(eq(main_device.id, input.deviceId));

	await db.insert(main_device_event).values({
		deviceId: input.deviceId,
		eventType: 'telemetry',
		payload: { currentUrl: input.currentUrl ?? null, spec: input.spec, location: input.location, ip }
	});

	// Push to any viewers on server device detail page
	hub.emitDevice(input.deviceId, {
		type: 'telemetry',
		deviceId: input.deviceId,
		orgId: input.orgId,
		at: now.toISOString(),
		currentUrl: input.currentUrl ?? null,
		spec: input.spec,
		location: input.location,
		ip
	});

	return jsonOk({ ok: true });
};


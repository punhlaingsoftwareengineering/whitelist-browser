import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { main_device, main_org, main_device_event } from '$lib/server/db/schema';
import { and, desc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const org = await db.query.main_org.findFirst({
		where: and(eq(main_org.id, event.params.id), eq(main_org.ownerUserId, event.locals.user!.id))
	});
	if (!org) return { device: null, recent: [] };

	const device = await db.query.main_device.findFirst({
		where: and(eq(main_device.id, event.params.deviceId), eq(main_device.orgId, event.params.id))
	});
	if (!device) return { device: null, recent: [] };

	const recent = await db.query.main_device_event.findMany({
		where: eq(main_device_event.deviceId, event.params.deviceId),
		orderBy: desc(main_device_event.createdAt),
		limit: 25
	});

	return {
		device: {
			id: device.id,
			deviceName: device.deviceName,
			deviceFingerprint: device.deviceFingerprint,
			lastSeenAt: device.lastSeenAt?.toISOString() ?? null,
			lastIp: device.lastIp ?? null,
			lastLocation: device.lastLocation,
			lastSpec: device.lastSpec,
			lastAppVersion: device.lastAppVersion ?? null
		},
		recent: recent.map((e) => ({
			id: e.id,
			eventType: e.eventType,
			payload: e.payload,
			createdAt: e.createdAt.toISOString()
		}))
	};
};


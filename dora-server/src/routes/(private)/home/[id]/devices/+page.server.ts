import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { main_device, main_org } from '$lib/server/db/schema';
import { and, desc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const org = await db.query.main_org.findFirst({
		where: and(eq(main_org.id, event.params.id), eq(main_org.ownerUserId, event.locals.user!.id))
	});
	if (!org) return { devices: [] };

	const devices = await db.query.main_device.findMany({
		where: eq(main_device.orgId, event.params.id),
		orderBy: desc(main_device.updatedAt)
	});

	return {
		devices: devices.map((d) => {
			const spec = (d.lastSpec ?? {}) as Record<string, unknown>;
			return {
				...d,
				lastSpec: spec,
				username: typeof spec.username === 'string' ? spec.username : null,
				hostname: typeof spec.hostname === 'string' ? spec.hostname : null,
				os: typeof spec.os === 'string' ? spec.os : null
			};
		})
	};
};


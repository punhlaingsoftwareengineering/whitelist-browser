import type { PageServerLoad } from './$types';
import { getOrgDetail } from '$lib/server/remote/main/org_detail';
import { db } from '$lib/server/db';
import { main_org, main_device_request, master_status } from '$lib/server/db/schema';
import { and, desc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const detail = await getOrgDetail(event.locals.user!, event.params.id);
	if (!detail) return { org: null, proxy: null, sites: [], activeSecret: null, requests: [] };

	// initial device requests list (avoid client fetch during SSR/hydration)
	const org = await db.query.main_org.findFirst({
		where: and(eq(main_org.id, event.params.id), eq(main_org.ownerUserId, event.locals.user!.id))
	});
	if (!org) return { ...detail, requests: [] };

	const rows = await db.query.main_device_request.findMany({
		where: eq(main_device_request.orgId, event.params.id),
		orderBy: desc(main_device_request.requestedAt)
	});

	const statusById = new Map<string, string>();
	for (const id of Array.from(new Set(rows.map((r) => r.requestStatusId)))) {
		const s = await db.query.master_status.findFirst({ where: eq(master_status.id, id) });
		if (s) statusById.set(id, s.code);
	}

	return {
		...detail,
		requests: rows.map((r) => ({
			id: r.id,
			deviceFingerprint: r.deviceFingerprint,
			devicePublicInfo: r.devicePublicInfo as Record<string, unknown>,
			requestedAt: r.requestedAt.toISOString(),
			status: statusById.get(r.requestStatusId) ?? 'PENDING',
			deviceName: r.deviceName
		}))
	};
};


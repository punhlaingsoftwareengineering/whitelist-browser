import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/shared/zod/_helpers';
import { db } from '$lib/server/db';
import { main_device_request, master_status, main_org_proxy, main_org_site, main_device } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

export const GET: RequestHandler = async (event) => {
	const requestId = event.url.searchParams.get('requestId');
	if (!requestId) return jsonError(400, 'Missing requestId');

	const req = await db.query.main_device_request.findFirst({
		where: eq(main_device_request.id, requestId)
	});
	if (!req) return jsonError(404, 'Not found');

	const status = await db.query.master_status.findFirst({ where: eq(master_status.id, req.requestStatusId) });
	const statusCode = status?.code ?? 'PENDING';

	if (statusCode !== 'APPROVED') {
		return jsonOk({ ok: true, status: statusCode });
	}

	const device = await db.query.main_device.findFirst({
		where: and(eq(main_device.orgId, req.orgId), eq(main_device.deviceFingerprint, req.deviceFingerprint))
	});
	if (!device) return jsonError(500, 'Approved but device missing');

	const proxy = await db.query.main_org_proxy.findFirst({ where: eq(main_org_proxy.orgId, req.orgId) });
	const sites = await db.query.main_org_site.findMany({ where: eq(main_org_site.orgId, req.orgId) });

	return jsonOk({
		ok: true,
		status: statusCode,
		orgId: req.orgId,
		deviceId: device.id,
		proxy: proxy ? { host: proxy.host, port: proxy.port } : null,
		sites: sites.map((s) => ({ id: s.id, label: s.label, urlPattern: s.urlPattern }))
	});
};


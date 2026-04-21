import type { RequestHandler } from './$types';
import { jsonError, jsonOk, parseOrThrow } from '$lib/shared/zod/_helpers';
import { ZDeviceOptionsInput } from '$lib/shared/zod/device';
import { db } from '$lib/server/db';
import { main_device, main_device_request, main_org_proxy, main_org_site, master_status } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

export const OPTIONS: RequestHandler = async () =>
	new Response(null, {
		status: 204,
		headers: {
			'access-control-allow-origin': '*',
			'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
			'access-control-allow-headers': 'content-type, authorization'
		}
	});

export const GET: RequestHandler = async (event) => {
	const orgId = event.url.searchParams.get('orgId');
	const deviceId = event.url.searchParams.get('deviceId');
	const input = parseOrThrow(ZDeviceOptionsInput, { orgId, deviceId });

	const device = await db.query.main_device.findFirst({
		where: and(eq(main_device.id, input.deviceId), eq(main_device.orgId, input.orgId))
	});
	if (!device) return jsonError(404, 'Device not found');

	// If the latest request for this device fingerprint is rejected/ignored, treat device as revoked.
	const req = await db.query.main_device_request.findFirst({
		where: and(
			eq(main_device_request.orgId, input.orgId),
			eq(main_device_request.deviceFingerprint, device.deviceFingerprint)
		),
		orderBy: (t, { desc }) => [desc(t.requestedAt)]
	});
	if (req) {
		const status = await db.query.master_status.findFirst({ where: eq(master_status.id, req.requestStatusId) });
		const code = status?.code ?? 'PENDING';
		if (code === 'REJECTED' || code === 'IGNORED') {
			return jsonOk({ ok: true, status: code, proxy: null, sites: [] });
		}
	}

	const proxy = await db.query.main_org_proxy.findFirst({ where: eq(main_org_proxy.orgId, input.orgId) });
	const sites = await db.query.main_org_site.findMany({ where: eq(main_org_site.orgId, input.orgId) });

	return jsonOk({
		ok: true,
		status: 'APPROVED',
		proxy: proxy ? { host: proxy.host, port: proxy.port } : null,
		sites: sites.map((s) => ({ id: s.id, label: s.label, urlPattern: s.urlPattern }))
	});
};


import { db } from '$lib/server/db';
import { main_org, main_org_proxy } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { getMasterStatusId } from '$lib/server/status';

type AuthedUser = { id: string };

export async function upsertProxy(user: AuthedUser, input: { orgId: string; host: string; port: number }) {
	const org = await db.query.main_org.findFirst({
		where: and(eq(main_org.id, input.orgId), eq(main_org.ownerUserId, user.id))
	});
	if (!org) return null;

	const activeId = await getMasterStatusId('ACTIVE');

	const existing = await db.query.main_org_proxy.findFirst({
		where: eq(main_org_proxy.orgId, input.orgId)
	});

	if (existing) {
		const [row] = await db
			.update(main_org_proxy)
			.set({ host: input.host, port: input.port })
			.where(eq(main_org_proxy.id, existing.id))
			.returning();
		return row;
	}

	const [row] = await db
		.insert(main_org_proxy)
		.values({
			orgId: input.orgId,
			host: input.host,
			port: input.port,
			masterStatusId: activeId
		})
		.returning();
	return row;
}

export async function deleteProxy(user: AuthedUser, orgId: string) {
	const org = await db.query.main_org.findFirst({
		where: and(eq(main_org.id, orgId), eq(main_org.ownerUserId, user.id))
	});
	if (!org) return null;

	const [row] = await db.delete(main_org_proxy).where(eq(main_org_proxy.orgId, orgId)).returning();
	return row ?? null;
}


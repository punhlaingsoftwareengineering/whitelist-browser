import { db } from '$lib/server/db';
import { main_org, main_org_site } from '$lib/server/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { getMasterStatusId } from '$lib/server/status';

type AuthedUser = { id: string };

export function listSites(user: AuthedUser, orgId: string) {
	const run = async () => {
		const org = await db.query.main_org.findFirst({
			where: and(eq(main_org.id, orgId), eq(main_org.ownerUserId, user.id))
		});
		if (!org) return null;

		return db.query.main_org_site.findMany({
			where: eq(main_org_site.orgId, orgId),
			orderBy: desc(main_org_site.createdAt)
		});
	};

	return Object.assign(run, { refresh: run });
}

export async function createSite(
	user: AuthedUser,
	input: { orgId: string; label: string; urlPattern: string }
) {
	const org = await db.query.main_org.findFirst({
		where: and(eq(main_org.id, input.orgId), eq(main_org.ownerUserId, user.id))
	});
	if (!org) return null;

	const activeId = await getMasterStatusId('ACTIVE');
	const [row] = await db
		.insert(main_org_site)
		.values({
			orgId: input.orgId,
			label: input.label,
			urlPattern: input.urlPattern,
			masterStatusId: activeId
		})
		.returning();
	return row;
}

export async function updateSite(
	user: AuthedUser,
	input: { id: string; orgId: string; label: string; urlPattern: string }
) {
	const org = await db.query.main_org.findFirst({
		where: and(eq(main_org.id, input.orgId), eq(main_org.ownerUserId, user.id))
	});
	if (!org) return null;

	const [row] = await db
		.update(main_org_site)
		.set({ label: input.label, urlPattern: input.urlPattern })
		.where(and(eq(main_org_site.id, input.id), eq(main_org_site.orgId, input.orgId)))
		.returning();
	return row ?? null;
}

export async function deleteSite(user: AuthedUser, input: { id: string; orgId: string }) {
	const org = await db.query.main_org.findFirst({
		where: and(eq(main_org.id, input.orgId), eq(main_org.ownerUserId, user.id))
	});
	if (!org) return null;

	const [row] = await db
		.delete(main_org_site)
		.where(and(eq(main_org_site.id, input.id), eq(main_org_site.orgId, input.orgId)))
		.returning();
	return row ?? null;
}


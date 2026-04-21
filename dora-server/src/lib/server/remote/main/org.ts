import { db } from '$lib/server/db';
import { main_org } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getMasterStatusId } from '$lib/server/status';

type AuthedUser = { id: string };

export function listOrgs(user: AuthedUser) {
	const run = async () =>
		db
			.select()
			.from(main_org)
			.where(and(eq(main_org.ownerUserId, user.id)))
			.orderBy(desc(main_org.createdAt));

	return Object.assign(run, {
		refresh: run
	});
}

export async function createOrg(user: AuthedUser, input: { name: string }) {
	const activeId = await getMasterStatusId('ACTIVE');
	const [row] = await db
		.insert(main_org)
		.values({
			ownerUserId: user.id,
			name: input.name,
			masterStatusId: activeId
		})
		.returning();

	return row;
}

export async function updateOrg(user: AuthedUser, input: { id: string; name: string }) {
	const [row] = await db
		.update(main_org)
		.set({ name: input.name })
		.where(and(eq(main_org.id, input.id), eq(main_org.ownerUserId, user.id)))
		.returning();

	return row ?? null;
}

export async function deleteOrg(user: AuthedUser, orgId: string) {
	// hard delete to match spec simplicity (can be soft-delete later via status)
	const [row] = await db
		.delete(main_org)
		.where(and(eq(main_org.id, orgId), eq(main_org.ownerUserId, user.id)))
		.returning();

	return row ?? null;
}


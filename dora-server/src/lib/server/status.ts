import { db } from '$lib/server/db';
import { master_status } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { z } from 'zod';
import { ZMasterStatusCode } from '$lib/shared/zod/master';

const cache = new Map<z.infer<typeof ZMasterStatusCode>, string>();

export async function getMasterStatusId(code: z.infer<typeof ZMasterStatusCode>) {
	const cached = cache.get(code);
	if (cached) return cached;

	const row = await db.query.master_status.findFirst({
		where: eq(master_status.code, code)
	});
	if (!row) throw new Error(`master_status not seeded: ${code}`);

	cache.set(code, row.id);
	return row.id;
}


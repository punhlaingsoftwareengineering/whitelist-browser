import type { PageServerLoad } from './$types';
import { listOrgs } from '$lib/server/remote/main/org';

export const load: PageServerLoad = async (event) => {
	// `(private)` layout already guards auth
	const orgs = await listOrgs(event.locals.user!)();
	return { orgs };
};


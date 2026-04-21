import fs from 'node:fs';
import path from 'node:path';

function loadDotEnvIfPresent() {
	const envPath = path.resolve(process.cwd(), '.env');
	if (!fs.existsSync(envPath)) return;

	const raw = fs.readFileSync(envPath, 'utf8');
	for (const line of raw.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		const eqIdx = trimmed.indexOf('=');
		if (eqIdx === -1) continue;

		const key = trimmed.slice(0, eqIdx).trim();
		let value = trimmed.slice(eqIdx + 1).trim();

		// Strip surrounding quotes if present
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		// Don't override explicit env vars
		if (process.env[key] === undefined) process.env[key] = value;
	}
}

loadDotEnvIfPresent();

const [{ db }, { master_status }, { eq }] = await Promise.all([
	import('$lib/server/db'),
	import('$lib/server/db/schema'),
	import('drizzle-orm')
]);

const STATUSES = [
	{ code: 'ACTIVE', label: 'Active', isTerminal: false },
	{ code: 'DISABLED', label: 'Disabled', isTerminal: false },
	{ code: 'DELETED', label: 'Deleted', isTerminal: true },
	{ code: 'PENDING', label: 'Pending', isTerminal: false },
	{ code: 'APPROVED', label: 'Approved', isTerminal: true },
	{ code: 'REJECTED', label: 'Rejected', isTerminal: true },
	{ code: 'IGNORED', label: 'Ignored', isTerminal: true }
] as const;

export async function seedMasterStatus() {
	for (const row of STATUSES) {
		const existing = await db.query.master_status.findFirst({
			where: eq(master_status.code, row.code)
		});

		if (existing) continue;

		await db.insert(master_status).values({
			code: row.code,
			label: row.label,
			isTerminal: row.isTerminal
		});
	}
}

export async function seedAll() {
	await seedMasterStatus();
}

// Allow running via `node -e "import('./dist/...').then(m=>m.seedAll())"` if needed.
if (import.meta.url === `file://${process.argv[1]}`) {
	seedAll()
		.then(() => {
			// eslint-disable-next-line no-console
			console.log('Seed complete');
		})
		.catch((err) => {
			// eslint-disable-next-line no-console
			console.error(err);
			process.exitCode = 1;
		});
}


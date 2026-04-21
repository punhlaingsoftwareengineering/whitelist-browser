import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const privateEnv: Record<string, string | undefined> = await (async () => {
	// `$env/*` is a SvelteKit virtual module. When running scripts directly with Node/tsx,
	// it won't exist, so we fall back to `process.env`.
	try {
		const mod = await import('$env/dynamic/private');
		return mod.env as Record<string, string | undefined>;
	} catch {
		return process.env as Record<string, string | undefined>;
	}
})();

const DATABASE_URL = privateEnv.DATABASE_URL;

if (!DATABASE_URL) {
	// Fly.io (and some CI builds) may not expose runtime secrets at build time.
	// We warn here and use a "disabled" connection string so the server can boot;
	// any code path that actually touches the DB will still fail loudly.
	//
	// NOTE: `.env` files do not apply in production for SvelteKit server runtime env.
	// Ensure you set DATABASE_URL as a Fly secret (`fly secrets set DATABASE_URL=...`).
	// eslint-disable-next-line no-console
	console.warn('[db] DATABASE_URL is not set. DB-backed routes will fail until it is provided.');
}

const client = new pg.Pool({
	connectionString: DATABASE_URL ?? 'postgres://localhost:1/_db_disabled',
	max: 2,
	connectionTimeoutMillis: 2_000
});

export const db = drizzle(client, { schema });

import type { RequestHandler } from './$types';
import { jsonOk } from '$lib/shared/zod/_helpers';
import { db } from '$lib/server/db';
import { main_update_release, main_update_asset } from '$lib/server/db/schema';
import { and, desc, eq } from 'drizzle-orm';

/**
 * Tauri v2 updater endpoint.
 *
 * Tauri updater will substitute variables in endpoint URLs; we keep query params optional.
 * Example endpoint:
 *   http://localhost:5173/api/updates/v2?target={{target}}&current_version={{current_version}}
 */
export const GET: RequestHandler = async (event) => {
	const target = event.url.searchParams.get('target') ?? '';
	const channel = event.url.searchParams.get('channel') ?? 'stable';

	// target examples vary; we keep a simple parse:
	// - linux-x86_64, windows-x86_64, darwin-aarch64, etc.
	const [platformGuess, archGuess] = target.split(/[-_]/);
	const platform = platformGuess || 'unknown';
	const arch = archGuess || 'unknown';

	const release = await db.query.main_update_release.findFirst({
		where: and(eq(main_update_release.channel, channel), eq(main_update_release.isDraft, false)),
		orderBy: desc(main_update_release.pubDate)
	});

	if (!release) {
		// No update available
		return jsonOk(null);
	}

	const asset = await db.query.main_update_asset.findFirst({
		where: and(
			eq(main_update_asset.releaseId, release.id),
			eq(main_update_asset.platform, platform),
			eq(main_update_asset.arch, arch)
		)
	});

	if (!asset) {
		// Release exists but no matching platform artifact
		return jsonOk(null);
	}

	// Tauri updater manifest (v2 format)
	return jsonOk({
		version: release.version,
		notes: release.notes,
		pub_date: release.pubDate.toISOString(),
		platforms: {
			[target || `${platform}-${arch}`]: {
				url: asset.url,
				signature: asset.signature
			}
		}
	});
};


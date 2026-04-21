import { pgTable, text, integer, uniqueIndex } from 'drizzle-orm/pg-core';
import { createdUpdatedColumns, uuidTextPk } from '../_columns';
import { master_status } from '../master/status';
import { main_update_release } from './update_release';

export const main_update_asset = pgTable(
	'main_update_asset',
	{
		id: uuidTextPk('id'),
		releaseId: text('release_id')
			.notNull()
			.references(() => main_update_release.id, { onDelete: 'cascade' }),

		// Tauri target triple-ish info (kept as text for flexibility)
		platform: text('platform').notNull(), // e.g. "linux", "windows", "macos"
		arch: text('arch').notNull(), // e.g. "x86_64", "aarch64"

		// Where updater artifacts live (can be S3/GH releases/etc.)
		url: text('url').notNull(),
		signature: text('signature').notNull(), // .sig content as base64 or raw depending on your publishing flow

		// Optional integrity info
		sha256: text('sha256'),
		size: integer('size'),

		masterStatusId: text('master_status_id')
			.notNull()
			.references(() => master_status.id),
		...createdUpdatedColumns()
	},
	(t) => [uniqueIndex('main_update_asset_release_platform_arch_uq').on(t.releaseId, t.platform, t.arch)]
);


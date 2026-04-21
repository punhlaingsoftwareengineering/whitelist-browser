import { pgTable, text, timestamp, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { createdUpdatedColumns, uuidTextPk } from '../_columns';
import { master_status } from '../master/status';

export const main_update_release = pgTable(
	'main_update_release',
	{
		id: uuidTextPk('id'),
		channel: text('channel').notNull().default('stable'),
		version: text('version').notNull(), // semver string, e.g. 1.2.3
		notes: text('notes').notNull().default(''),
		pubDate: timestamp('pub_date').defaultNow().notNull(),
		isDraft: boolean('is_draft').default(true).notNull(),
		masterStatusId: text('master_status_id')
			.notNull()
			.references(() => master_status.id),
		...createdUpdatedColumns()
	},
	(t) => [uniqueIndex('main_update_release_channel_version_uq').on(t.channel, t.version)]
);


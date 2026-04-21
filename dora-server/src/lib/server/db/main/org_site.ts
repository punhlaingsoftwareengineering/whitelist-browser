import { pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { createdUpdatedColumns, uuidTextPk } from '../_columns';
import { master_status } from '../master/status';
import { main_org } from './org';

export const main_org_site = pgTable(
	'main_org_site',
	{
		id: uuidTextPk('id'),
		orgId: text('org_id')
			.notNull()
			.references(() => main_org.id, { onDelete: 'cascade' }),
		label: text('label').notNull(),
		urlPattern: text('url_pattern').notNull(),
		masterStatusId: text('master_status_id')
			.notNull()
			.references(() => master_status.id),
		...createdUpdatedColumns()
	},
	(table) => [uniqueIndex('main_org_site_org_label_uq').on(table.orgId, table.label)]
);


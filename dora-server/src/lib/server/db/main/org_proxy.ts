import { integer, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { createdUpdatedColumns, uuidTextPk } from '../_columns';
import { master_status } from '../master/status';
import { main_org } from './org';

export const main_org_proxy = pgTable(
	'main_org_proxy',
	{
		id: uuidTextPk('id'),
		orgId: text('org_id')
			.notNull()
			.references(() => main_org.id, { onDelete: 'cascade' }),
		host: text('host').notNull(),
		port: integer('port').notNull(),
		masterStatusId: text('master_status_id')
			.notNull()
			.references(() => master_status.id),
		...createdUpdatedColumns()
	},
	(table) => [uniqueIndex('main_org_proxy_org_uq').on(table.orgId)]
);


import { boolean, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createdUpdatedColumns, uuidTextPk } from '../_columns';
import { master_status } from '../master/status';
import { main_org } from './org';

export const main_org_secret = pgTable(
	'main_org_secret',
	{
		id: uuidTextPk('id'),
		orgId: text('org_id')
			.notNull()
			.references(() => main_org.id, { onDelete: 'cascade' }),
		orgNameCurrent: text('org_name_current').notNull(),
		secretKeyHash: text('secret_key_hash').notNull(),
		isActive: boolean('is_active').default(true).notNull(),
		rotatedAt: timestamp('rotated_at').defaultNow().notNull(),
		masterStatusId: text('master_status_id')
			.notNull()
			.references(() => master_status.id),
		...createdUpdatedColumns()
	},
	(table) => [
		uniqueIndex('main_org_secret_active_org_uq').on(table.orgId).where(sql`${table.isActive} = true`),
		uniqueIndex('main_org_secret_org_name_active_uq')
			.on(table.orgNameCurrent)
			.where(sql`${table.isActive} = true`)
	]
);


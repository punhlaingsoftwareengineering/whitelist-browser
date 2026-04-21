import { pgTable, text } from 'drizzle-orm/pg-core';
import { createdUpdatedColumns, uuidTextPk } from '../_columns';
import { master_status } from '../master/status';

export const main_org = pgTable('main_org', {
	id: uuidTextPk('id'),
	ownerUserId: text('owner_user_id').notNull(),
	name: text('name').notNull(),
	masterStatusId: text('master_status_id')
		.notNull()
		.references(() => master_status.id),
	...createdUpdatedColumns()
});


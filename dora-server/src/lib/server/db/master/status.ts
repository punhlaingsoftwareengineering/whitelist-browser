import { boolean, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { createdUpdatedColumns, uuidTextPk } from '../_columns';

export const master_status = pgTable(
	'master_status',
	{
		id: uuidTextPk('id'),
		code: text('code').notNull(),
		label: text('label').notNull(),
		isTerminal: boolean('is_terminal').default(false).notNull(),
		...createdUpdatedColumns()
	},
	(table) => [uniqueIndex('master_status_code_uq').on(table.code)]
);


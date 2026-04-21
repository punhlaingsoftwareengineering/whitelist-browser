import { timestamp, text } from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';

const now = () => /* @__PURE__ */ new Date();

export const uuidTextPk = (columnName = 'id') =>
	text(columnName).primaryKey().$defaultFn(() => uuidv7());

export const createdUpdatedColumns = () =>
	({
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().$onUpdate(now).notNull()
	}) as const;


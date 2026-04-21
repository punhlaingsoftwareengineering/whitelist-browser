import { jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { createdUpdatedColumns, uuidTextPk } from '../_columns';
import { master_status } from '../master/status';
import { main_org } from './org';

export const main_device_request = pgTable(
	'main_device_request',
	{
		id: uuidTextPk('id'),
		orgId: text('org_id')
			.notNull()
			.references(() => main_org.id, { onDelete: 'cascade' }),
		requestStatusId: text('request_status_id')
			.notNull()
			.references(() => master_status.id),
		deviceFingerprint: text('device_fingerprint').notNull(),
		devicePublicInfo: jsonb('device_public_info_json').notNull().default({}),
		requestedAt: timestamp('requested_at').defaultNow().notNull(),
		decidedAt: timestamp('decided_at'),
		decidedByUserId: text('decided_by_user_id'),
		deviceName: text('device_name'),
		masterStatusId: text('master_status_id')
			.notNull()
			.references(() => master_status.id),
		...createdUpdatedColumns()
	},
	(table) => [uniqueIndex('main_device_request_org_fingerprint_uq').on(table.orgId, table.deviceFingerprint)]
);


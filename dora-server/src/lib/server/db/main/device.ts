import { jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { createdUpdatedColumns, uuidTextPk } from '../_columns';
import { master_status } from '../master/status';
import { main_org } from './org';

export const main_device = pgTable(
	'main_device',
	{
		id: uuidTextPk('id'),
		orgId: text('org_id')
			.notNull()
			.references(() => main_org.id, { onDelete: 'cascade' }),
		deviceName: text('device_name').notNull(),
		deviceFingerprint: text('device_fingerprint').notNull(),
		lastSeenAt: timestamp('last_seen_at'),
		lastIp: text('last_ip'),
		lastLocation: jsonb('last_location_json').notNull().default({}),
		lastSpec: jsonb('last_spec_json').notNull().default({}),
		lastAppVersion: text('last_app_version'),
		masterStatusId: text('master_status_id')
			.notNull()
			.references(() => master_status.id),
		...createdUpdatedColumns()
	},
	(table) => [uniqueIndex('main_device_org_fingerprint_uq').on(table.orgId, table.deviceFingerprint)]
);


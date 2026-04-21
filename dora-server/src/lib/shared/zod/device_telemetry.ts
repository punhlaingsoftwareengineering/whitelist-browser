import { z } from 'zod';
import { createZodSchema } from './_helpers';
import { ZOrgId } from './org';
import { ZUuidV7 } from './master';

export const ZDeviceTelemetryInput = createZodSchema(
	z.object({
		orgId: ZOrgId,
		deviceId: ZUuidV7,
		currentUrl: z.string().max(2048).nullable().optional(),
		spec: z
			.object({
				hostname: z.string().max(255).optional(),
				username: z.string().max(255).optional(),
				os: z.string().max(255).optional(),
				osVersion: z.string().max(255).optional(),
				arch: z.string().max(255).optional(),
				appVersion: z.string().max(64).optional()
			})
			.partial()
			.default({}),
		location: z
			.object({
				country: z.string().max(8).optional(),
				city: z.string().max(120).optional(),
				region: z.string().max(120).optional()
			})
			.partial()
			.default({})
	})
);


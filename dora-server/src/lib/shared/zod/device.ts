import { z } from 'zod';
import { createZodSchema } from './_helpers';
import { ZOrgId } from './org';
import { ZUuidV7 } from './master';

export const ZDeviceFingerprint = createZodSchema(z.string().min(8).max(256));

export const ZDesktopConnectHello = createZodSchema(
	z.object({
		orgName: z.string().min(1).max(120),
		secretKey: z.string().min(8).max(256),
		deviceFingerprint: ZDeviceFingerprint,
		deviceInfo: z.record(z.string(), z.unknown()).default({})
	})
);

export const ZDeviceRequestDecisionInput = createZodSchema(
	z.object({
		requestId: ZUuidV7,
		decision: z.enum(['APPROVE', 'REJECT', 'IGNORE']),
		deviceName: z.string().min(1).max(120).optional()
	})
);

export const ZDesktopApprovedPayload = createZodSchema(
	z.object({
		ok: z.literal(true),
		orgId: ZOrgId,
		deviceId: ZUuidV7,
		proxy: z
			.object({
				host: z.string(),
				port: z.number().int()
			})
			.nullable(),
		sites: z.array(
			z.object({
				id: ZUuidV7,
				label: z.string(),
				urlPattern: z.string()
			})
		)
	})
);

export const ZDeviceHeartbeatInput = createZodSchema(
	z.object({
		orgId: ZOrgId,
		deviceId: ZUuidV7,
		currentUrl: z.string().max(2048).nullable().optional()
	})
);

export const ZDeviceOptionsInput = createZodSchema(
	z.object({
		orgId: ZOrgId,
		deviceId: ZUuidV7
	})
);


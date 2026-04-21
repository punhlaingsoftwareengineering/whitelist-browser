import { z } from 'zod';
import { createZodSchema } from './_helpers';

export const ZUuidV7 = createZodSchema(z.string().uuid());

export const ZMasterStatusCode = createZodSchema(
	z.enum(['ACTIVE', 'DISABLED', 'DELETED', 'PENDING', 'APPROVED', 'REJECTED', 'IGNORED'])
);


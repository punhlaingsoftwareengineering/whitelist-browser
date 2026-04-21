import crypto from 'node:crypto';

export function sha256Hex(input: string) {
	return crypto.createHash('sha256').update(input).digest('hex');
}

export function randomSecret(bytes = 32) {
	return crypto.randomBytes(bytes).toString('base64url');
}

/**
 * Stable "code name" from a human org name, e.g. "Pun Hlaing Hospitals" -> "pun_hlaing_hospitals".
 * Used by desktop connect as `orgName`.
 */
export function orgCodeFromName(name: string) {
	const slug = name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.replace(/_+/g, '_');
	return slug || `org_${crypto.randomBytes(3).toString('hex')}`;
}


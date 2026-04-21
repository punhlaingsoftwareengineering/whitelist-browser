import { describe, expect, it } from 'vitest';
import { randomSecret, sha256Hex } from './crypto';

describe('crypto helpers', () => {
	it('sha256Hex is deterministic', () => {
		expect(sha256Hex('abc')).toBe(sha256Hex('abc'));
		expect(sha256Hex('abc')).not.toBe(sha256Hex('abcd'));
	});

	it('randomSecret is url-safe', () => {
		const s = randomSecret(16);
		expect(s.length).toBeGreaterThan(0);
		expect(/[+/=]/.test(s)).toBe(false);
	});
});


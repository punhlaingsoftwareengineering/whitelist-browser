import { describe, expect, it } from 'vitest';
import { matchPattern, isAllowed } from './allowlist';

describe('allowlist matching', () => {
	it('matches exact url', () => {
		expect(matchPattern('https://example.com', 'https://example.com')).toBe(true);
		expect(matchPattern('https://example.com/a', 'https://example.com')).toBe(false);
	});

	it('matches wildcard', () => {
		expect(matchPattern('https://example.com/a', 'https://example.com/*')).toBe(true);
		expect(matchPattern('https://evil.com', 'https://example.com/*')).toBe(false);
	});

	it('checks any allowed pattern', () => {
		expect(isAllowed('https://a.com/x', ['https://b.com/*', 'https://a.com/*'])).toBe(true);
	});
});


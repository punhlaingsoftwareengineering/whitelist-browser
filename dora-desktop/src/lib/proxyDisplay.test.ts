import { describe, expect, it } from 'vitest';
import { formatObfuscatedProxy } from './proxyDisplay';

describe('formatObfuscatedProxy', () => {
	it('masks host and port', () => {
		expect(formatObfuscatedProxy({ host: 'proxy.internal.corp', port: 8080 })).toBe(
			`p${'•'.repeat(10)}:••••`
		);
	});

	it('handles empty host', () => {
		expect(formatObfuscatedProxy({ host: '   ', port: 443 })).toBe('••••:••••');
	});
});

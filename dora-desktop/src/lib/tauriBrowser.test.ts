import { describe, expect, it } from 'vitest';
import { proxyUrlFromOrgProxy } from './tauriBrowser';

describe('proxyUrlFromOrgProxy', () => {
	it('matches manual HTTP proxy shape (Firefox / corporate)', () => {
		// Same host:port style as Firefox "HTTP Proxy" with "use for HTTPS"
		expect(proxyUrlFromOrgProxy({ host: '172.33.157.252', port: 8118 })).toBe('http://172.33.157.252:8118');
	});

	it('brackets IPv6 literals', () => {
		expect(proxyUrlFromOrgProxy({ host: '2001:db8::1', port: 8080 })).toBe('http://[2001:db8::1]:8080');
	});

	it('returns undefined for invalid port', () => {
		expect(proxyUrlFromOrgProxy({ host: '127.0.0.1', port: 0 })).toBeUndefined();
	});
});

/** Host + port as stored for the real proxy connection (not for display). */
export type ProxyEndpoint = { host: string; port: number };

/**
 * Renders proxy endpoint for on-screen display without revealing the real port
 * or full hostname (shoulder-surfing / screenshots).
 */
export function formatObfuscatedProxy(proxy: ProxyEndpoint): string {
	const raw = proxy.host.trim();
	if (!raw) return '••••:••••';
	const first = raw[0];
	const midLen = Math.min(10, Math.max(2, raw.length - 1));
	const hostPart = `${first}${'•'.repeat(midLen)}`;
	return `${hostPart}:••••`;
}

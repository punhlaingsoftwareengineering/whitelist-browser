export type OrgProxy = { host: string; port: number };

const ALPHA = 'abcdefghijklmnopqrstuvwxyz';

function randomAlphaSegment(len: number): string {
	const out: string[] = [];
	const buf = new Uint8Array(len);
	crypto.getRandomValues(buf);
	for (let i = 0; i < len; i++) {
		out.push(ALPHA[buf[i]! % 26]!);
	}
	return out.join('');
}

/**
 * Tauri accepts `http://` (HTTP CONNECT) or `socks5://` URLs. The org admin UI only
 * stores host + port; we assume an HTTP proxy (typical for corporate egress).
 *
 * Normalizes host (strips accidental scheme/path), brackets IPv6 literals, validates via URL.
 */
export function proxyUrlFromOrgProxy(proxy: OrgProxy | null | undefined): string | undefined {
	if (!proxy) return undefined;
	let host = proxy.host?.trim() ?? '';
	if (!host) return undefined;
	host = host.replace(/^https?:\/\//i, '');
	const slash = host.indexOf('/');
	if (slash >= 0) host = host.slice(0, slash);
	host = host.trim();
	if (!host) return undefined;

	const port = Number(proxy.port);
	if (!Number.isFinite(port) || port < 1 || port > 65535) return undefined;

	const hostForUrl = host.startsWith('[') ? host : host.includes(':') ? `[${host}]` : host;
	try {
		const u = new URL(`http://${hostForUrl}:${port}/`);
		if (!u.hostname) return undefined;
		return u.href.replace(/\/$/, '');
	} catch {
		return undefined;
	}
}

function newBrowserWindowLabel(): string {
	// Webview labels: documented charset a-zA-Z-/:_ (avoid digits for strict backends).
	return `browser-${randomAlphaSegment(4)}-${randomAlphaSegment(4)}-${randomAlphaSegment(8)}`;
}

/**
 * Opens a new Tauri WebviewWindow for browsing (main app window stays single).
 *
 * Site windows are created in Rust (`wb_open_site_window`) so every platform gets the same behavior:
 * org proxy, per-window data dir on Windows, allowlist checks, and handling of `window.open` /
 * `target=_blank` by opening additional windows with the same policy.
 *
 * Note: This is intentionally client-only; it no-ops during SSR.
 */
export async function openBrowserWindow(
	url: string,
	title?: string,
	proxy?: OrgProxy | null,
	allowedUrlPatterns?: string[]
) {
	if (typeof window === 'undefined') return;

	const label = newBrowserWindowLabel();
	const proxyUrl = proxyUrlFromOrgProxy(proxy) ?? null;
	let invoke: typeof import('@tauri-apps/api/core').invoke;
	try {
		({ invoke } = await import('@tauri-apps/api/core'));
	} catch {
		throw new Error('Tauri API not available (are you running in the Tauri app window?)');
	}

	await invoke('wb_open_site_window', {
		label,
		url,
		title: title ?? 'Dora',
		proxyUrl,
		allowedPatterns: allowedUrlPatterns?.length ? allowedUrlPatterns : null
	});
}

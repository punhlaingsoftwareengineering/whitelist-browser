export type OrgProxy = { host: string; port: number };

/**
 * Tauri accepts `http://` (HTTP CONNECT) or `socks5://` URLs. The org admin UI only
 * stores host + port; we assume an HTTP proxy (typical for corporate egress).
 */
export function proxyUrlFromOrgProxy(proxy: OrgProxy | null | undefined): string | undefined {
	if (!proxy) return undefined;
	const host = proxy.host?.trim();
	if (!host) return undefined;
	const port = Number(proxy.port);
	if (!Number.isFinite(port) || port < 1 || port > 65535) return undefined;
	return `http://${host}:${port}`;
}

function browserWindowOptions(url: string, title: string | undefined, proxy: OrgProxy | null | undefined) {
	const proxyUrl = proxyUrlFromOrgProxy(proxy);
	return {
		url,
		title: title ?? 'Whitelist Browser',
		width: 1100,
		height: 800,
		resizable: true,
		visible: true,
		focus: true,
		...(proxyUrl ? { proxyUrl } : {})
	};
}

function newBrowserWindowLabel(): string {
	// Each WebviewWindow needs a unique label; allows many site windows for multitasking.
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return `browser-${crypto.randomUUID()}`;
	}
	return `browser-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Opens a new Tauri WebviewWindow for browsing (main app window stays single).
 *
 * Note: This is intentionally client-only; it no-ops during SSR.
 * When `proxy` is set, it is applied at webview creation (WebKitGTK / WebView2).
 */
export async function openBrowserWindow(url: string, title?: string, proxy?: OrgProxy | null) {
	if (typeof window === 'undefined') return;

	let WebviewWindow: typeof import('@tauri-apps/api/webviewWindow').WebviewWindow;
	try {
		({ WebviewWindow } = await import('@tauri-apps/api/webviewWindow'));
	} catch {
		throw new Error('Tauri API not available (are you running in the Tauri app window?)');
	}

	const label = newBrowserWindowLabel();
	const win = new WebviewWindow(label, browserWindowOptions(url, title, proxy));

	win.once('tauri://error', (e: unknown) => {
		// eslint-disable-next-line no-console
		console.error('Browser window error', e);
	});
}

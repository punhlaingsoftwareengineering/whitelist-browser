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

function isWindowsOs(): boolean {
	if (typeof navigator === 'undefined') return false;
	const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
	const p = nav.userAgentData?.platform;
	if (p === 'Windows') return true;
	const ua = navigator.userAgent ?? '';
	return /Windows|Win32|Win64/i.test(ua);
}

async function resolveParentWindowLabel(): Promise<string> {
	try {
		const { getCurrentWindow } = await import('@tauri-apps/api/window');
		return getCurrentWindow().label;
	} catch {
		return 'main';
	}
}

async function browserWindowOptions(
	url: string,
	title: string | undefined,
	proxy: OrgProxy | null | undefined
) {
	const proxyUrl = proxyUrlFromOrgProxy(proxy);
	const base = {
		url,
		title: title ?? 'Whitelist Browser',
		width: 1100,
		height: 800,
		resizable: true,
		visible: true,
		focus: true,
		...(proxyUrl ? { proxyUrl } : {})
	};

	// Owned child windows on Windows can interfere with WebView2; keep browser windows top-level there.
	if (isWindowsOs()) {
		// Without this, Tauri gives every webview the same default WebView2 user-data dir. A second
		// webview with a different `proxyUrl` then shares that profile with the main window, which
		// WebView2 rejects — the window flashes and exits. A relative `dataDirectory` is resolved to
		// `%LOCALAPPDATA%/<window-label>/…`, unique per site window. See tauri-utils WindowConfig
		// (dataDirectory) and WebView2 multi-profile constraints.
		return { ...base, dataDirectory: 'whitelist-site-wv' };
	}

	const parent = await resolveParentWindowLabel();
	return { ...base, parent };
}

function newBrowserWindowLabel(): string {
	// Webview labels: documented charset a-zA-Z-/:_ (avoid digits for strict backends).
	return `browser-${randomAlphaSegment(4)}-${randomAlphaSegment(4)}-${randomAlphaSegment(8)}`;
}

function errorFromTauriEvent(e: unknown): Error {
	if (e instanceof Error) return e;
	if (typeof e === 'string') return new Error(e);
	if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
		return new Error((e as { message: string }).message);
	}
	try {
		return new Error(JSON.stringify(e));
	} catch {
		return new Error('Failed to create browser window');
	}
}

/**
 * Opens a new Tauri WebviewWindow for browsing (main app window stays single).
 *
 * Note: This is intentionally client-only; it no-ops during SSR.
 * When `proxy` is set, it is applied at webview creation (WebKitGTK / WebView2; macOS needs the
 * `macos-proxy` Cargo feature on the Tauri crate).
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
	const options = await browserWindowOptions(url, title, proxy);

	// WebView2 reentrancy: creating a webview from the same stack as a webview event (e.g. click)
	// can deadlock or never complete on Windows. Yield to the browser event loop first.
	// See https://github.com/tauri-apps/wry/issues/583 and MS WebView2 threading docs.
	await new Promise<void>((r) => {
		window.setTimeout(() => r(), 0);
	});

	return new Promise<void>((resolve, reject) => {
		const win = new WebviewWindow(label, options);
		win.once('tauri://created', () => resolve());
		win.once('tauri://error', (e: unknown) => {
			reject(errorFromTauriEvent(e));
		});
	});
}

const BUILTIN_ORIGINS = [
	'http://localhost:5173',
	'https://whitelist-browser.fly.dev',
	'https://whitelist-browser-server.fly.dev'
];

function envOrigin(): string | undefined {
	const v = import.meta.env.VITE_SERVER_ORIGIN;
	return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

export function getServerOriginCandidates(): string[] {
	const list: string[] = [];
	const e = envOrigin();
	if (e) list.push(e);
	for (const o of BUILTIN_ORIGINS) {
		if (!list.includes(o)) list.push(o);
	}
	return list;
}

let activeOrigin: string | null = null;

/** Origin that last succeeded for API calls (or first candidate). */
export function getResolvedServerOrigin(): string {
	return activeOrigin ?? getServerOriginCandidates()[0]!;
}

/** First configured origin (build-time / env). Prefer `getResolvedServerOrigin()` after requests. */
export const SERVER_ORIGIN = getServerOriginCandidates()[0]!;

async function fetchWithFallback(path: string, init?: RequestInit): Promise<Response> {
	const candidates = activeOrigin
		? [activeOrigin, ...getServerOriginCandidates().filter((o) => o !== activeOrigin)]
		: getServerOriginCandidates();
	let lastError: unknown;
	for (const origin of candidates) {
		try {
			const res = await fetch(`${origin}${path}`, init);
			activeOrigin = origin;
			return res;
		} catch (e) {
			lastError = e;
		}
	}
	if (lastError instanceof Error) throw lastError;
	throw new Error('Server unreachable');
}

export async function postConnect(payload: unknown) {
	const res = await fetchWithFallback('/api/device/connect', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(payload)
	});
	const json = await res.json();
	if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? 'Connect failed');
	return json as { ok: true; requestId: string; orgId: string };
}

export async function getRequestStatus(requestId: string) {
	const res = await fetchWithFallback(
		`/api/device/requests/status?requestId=${encodeURIComponent(requestId)}`
	);
	const json = await res.json();
	if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? 'Status failed');
	return json as {
		ok: true;
		status: string;
		orgId?: string;
		deviceId?: string;
		proxy?: { host: string; port: number } | null;
		sites?: { id: string; label: string; urlPattern: string }[];
	};
}

export async function getDeviceOptions(orgId: string, deviceId: string) {
	const res = await fetchWithFallback(
		`/api/device/options?orgId=${encodeURIComponent(orgId)}&deviceId=${encodeURIComponent(deviceId)}`
	);
	const json = await res.json();
	if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? 'Options failed');
	return json as {
		ok: true;
		status?: string;
		proxy: { host: string; port: number } | null;
		sites: { id: string; label: string; urlPattern: string }[];
	};
}

export async function getDeviceOptionsWithTimeout(
	orgId: string,
	deviceId: string,
	timeoutMs = 2500
) {
	const path = `/api/device/options?orgId=${encodeURIComponent(orgId)}&deviceId=${encodeURIComponent(deviceId)}`;
	const candidates = activeOrigin
		? [activeOrigin, ...getServerOriginCandidates().filter((o) => o !== activeOrigin)]
		: getServerOriginCandidates();
	let lastError: unknown;
	for (const origin of candidates) {
		const controller = new AbortController();
		const t = setTimeout(() => controller.abort(), timeoutMs);
		try {
			const res = await fetch(`${origin}${path}`, { signal: controller.signal });
			clearTimeout(t);
			const json = await res.json();
			if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? 'Options failed');
			activeOrigin = origin;
			return json as {
				ok: true;
				status?: string;
				proxy: { host: string; port: number } | null;
				sites: { id: string; label: string; urlPattern: string }[];
			};
		} catch (e) {
			clearTimeout(t);
			lastError = e;
		}
	}
	if (lastError instanceof Error) throw lastError;
	throw new Error('Server unreachable');
}

import { invoke } from '@tauri-apps/api/core';

export type StoredConnection = {
	orgId: string;
	deviceId: string;
};

export type StoredConfig = {
	proxy: { host: string; port: number } | null;
	sites: { id: string; label: string; urlPattern: string }[];
};

type StorageBlob = {
	connection: StoredConnection | null;
	config: StoredConfig | null;
	fingerprint: string | null;
};

const KEY_CONN = 'wb.connection';
const KEY_CFG = 'wb.config';
const KEY_FINGERPRINT = 'wb.fingerprint';

const emptyBlob = (): StorageBlob => ({
	connection: null,
	config: null,
	fingerprint: null
});

let blob: StorageBlob = emptyBlob();
let initPromise: Promise<void> | null = null;

function hasLocalStorage() {
	try {
		return typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function';
	} catch {
		return false;
	}
}

function readLocalStorageIntoBlob() {
	if (!hasLocalStorage()) return;
	const rawConn = localStorage.getItem(KEY_CONN);
	const rawCfg = localStorage.getItem(KEY_CFG);
	const rawFp = localStorage.getItem(KEY_FINGERPRINT);
	try {
		if (rawConn) blob.connection = JSON.parse(rawConn) as StoredConnection;
	} catch {
		blob.connection = null;
	}
	try {
		if (rawCfg) blob.config = JSON.parse(rawCfg) as StoredConfig;
	} catch {
		blob.config = null;
	}
	if (rawFp) blob.fingerprint = rawFp;
}

function mirrorBlobToLocalStorage() {
	if (!hasLocalStorage()) return;
	if (blob.connection) localStorage.setItem(KEY_CONN, JSON.stringify(blob.connection));
	else localStorage.removeItem(KEY_CONN);
	if (blob.config) localStorage.setItem(KEY_CFG, JSON.stringify(blob.config));
	else localStorage.removeItem(KEY_CFG);
	if (blob.fingerprint) localStorage.setItem(KEY_FINGERPRINT, blob.fingerprint);
	else localStorage.removeItem(KEY_FINGERPRINT);
}

async function persist() {
	mirrorBlobToLocalStorage();
	try {
		await invoke('wb_storage_save', {
			json: JSON.stringify({
				connection: blob.connection,
				config: blob.config,
				fingerprint: blob.fingerprint
			})
		});
	} catch {
		// Browser / dev without Tauri — localStorage only
	}
}

/**
 * Load from disk (Tauri) and/or migrate browser localStorage. Call once from root layout before routing.
 */
export async function initDeviceStorage(): Promise<void> {
	if (initPromise) return initPromise;
	initPromise = (async () => {
		blob = emptyBlob();
		try {
			const raw = await invoke<string | null>('wb_storage_load');
			if (raw) {
				const o = JSON.parse(raw) as Partial<StorageBlob>;
				blob.connection = o.connection ?? null;
				blob.config = o.config ?? null;
				blob.fingerprint = o.fingerprint ?? null;
			}
		} catch {
			// Not running inside Tauri
		}
		if (!blob.connection && !blob.config && !blob.fingerprint) {
			readLocalStorageIntoBlob();
			if (blob.connection || blob.config || blob.fingerprint) {
				await persist();
			}
		} else {
			mirrorBlobToLocalStorage();
		}
	})();
	return initPromise;
}

export function getOrCreateFingerprint() {
	if (blob.fingerprint) return blob.fingerprint;
	const fp = `fp_${crypto.randomUUID()}`;
	blob.fingerprint = fp;
	void persist();
	return fp;
}

export function loadConnection(): StoredConnection | null {
	return blob.connection;
}

export function saveConnection(conn: StoredConnection) {
	blob.connection = conn;
	void persist();
}

export function clearConnection() {
	blob.connection = null;
	blob.config = null;
	void persist();
}

export function loadConfig(): StoredConfig | null {
	return blob.config;
}

export function saveConfig(cfg: StoredConfig) {
	blob.config = cfg;
	void persist();
}

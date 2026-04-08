import { getVersion } from '@tauri-apps/api/app';

/**
 * Tauri app version from `tauri.conf.json` / bundle. In plain browser dev, falls back to `"dev"`.
 */
export async function resolveAppVersion(): Promise<string> {
	try {
		return await getVersion();
	} catch {
		return 'dev';
	}
}

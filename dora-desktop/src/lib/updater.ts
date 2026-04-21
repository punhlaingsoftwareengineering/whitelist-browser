import { Channel, invoke, Resource } from '@tauri-apps/api/core';

export type DownloadEvent =
	| { event: 'Started'; data: { contentLength?: number } }
	| { event: 'Progress'; data: { chunkLength: number } }
	| { event: 'Finished' };

export type UpdateInfo = {
	rid: number;
	currentVersion: string;
	version: string;
	date?: string;
	body?: string;
	rawJson: Record<string, unknown>;
};

export class UpdateHandle extends Resource {
	readonly currentVersion: string;
	readonly version: string;
	readonly date?: string;
	readonly body?: string;
	readonly rawJson: Record<string, unknown>;

	constructor(meta: UpdateInfo) {
		super(meta.rid);
		this.currentVersion = meta.currentVersion;
		this.version = meta.version;
		this.date = meta.date;
		this.body = meta.body;
		this.rawJson = meta.rawJson;
	}

	async downloadAndInstall(onEvent?: (progress: DownloadEvent) => void) {
		const channel = new Channel<DownloadEvent>();
		if (onEvent) channel.onmessage = onEvent;
		await invoke('plugin:updater|download_and_install', { onEvent: channel, rid: this.rid });
	}
}

export async function checkForUpdate(): Promise<UpdateHandle | null> {
	const meta = (await invoke('plugin:updater|check', {})) as UpdateInfo | null;
	return meta ? new UpdateHandle(meta) : null;
}

export async function relaunchApp(): Promise<void> {
	await invoke('plugin:process|restart');
}


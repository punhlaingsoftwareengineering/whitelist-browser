type Json = Record<string, unknown>;

type OrgSubscriber = {
	send: (data: Json) => void;
};

type RequestSubscriber = {
	send: (data: Json) => void;
};

type DeviceSubscriber = {
	send: (data: Json) => void;
};

class Hub {
	private orgSubs = new Map<string, Set<OrgSubscriber>>();
	private requestSubs = new Map<string, Set<RequestSubscriber>>();
	private deviceSubs = new Map<string, Set<DeviceSubscriber>>();

	subscribeOrg(orgId: string, sub: OrgSubscriber) {
		const set = this.orgSubs.get(orgId) ?? new Set<OrgSubscriber>();
		set.add(sub);
		this.orgSubs.set(orgId, set);
		return () => set.delete(sub);
	}

	subscribeRequest(requestId: string, sub: RequestSubscriber) {
		const set = this.requestSubs.get(requestId) ?? new Set<RequestSubscriber>();
		set.add(sub);
		this.requestSubs.set(requestId, set);
		return () => set.delete(sub);
	}

	subscribeDevice(deviceId: string, sub: DeviceSubscriber) {
		const set = this.deviceSubs.get(deviceId) ?? new Set<DeviceSubscriber>();
		set.add(sub);
		this.deviceSubs.set(deviceId, set);
		return () => set.delete(sub);
	}

	emitOrg(orgId: string, payload: Json) {
		const subs = this.orgSubs.get(orgId);
		if (!subs) return;
		for (const sub of subs) sub.send(payload);
	}

	emitRequest(requestId: string, payload: Json) {
		const subs = this.requestSubs.get(requestId);
		if (!subs) return;
		for (const sub of subs) sub.send(payload);
	}

	emitDevice(deviceId: string, payload: Json) {
		const subs = this.deviceSubs.get(deviceId);
		if (!subs) return;
		for (const sub of subs) sub.send(payload);
	}
}

declare global {
	// eslint-disable-next-line no-var
	var __whitelistBrowserHub: Hub | undefined;
}

export const hub: Hub = globalThis.__whitelistBrowserHub ?? (globalThis.__whitelistBrowserHub = new Hub());


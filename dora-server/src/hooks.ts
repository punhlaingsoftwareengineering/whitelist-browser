import type { Reroute } from '@sveltejs/kit';

export const reroute: Reroute = (request) => new URL(request.url).pathname;

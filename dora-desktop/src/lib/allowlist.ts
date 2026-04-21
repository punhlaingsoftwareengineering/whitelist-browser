export function matchPattern(url: string, pattern: string) {
	// supports '*' wildcard
	const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
	const re = new RegExp(`^${escaped}$`);
	return re.test(url);
}

export function isAllowed(url: string, patterns: string[]) {
	return patterns.some((p) => matchPattern(url, p));
}


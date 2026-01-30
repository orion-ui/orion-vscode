export const toKebabCase = (value: string): string => {
	if (!value) {
		return value;
	}
	if (value.includes('-')) {
		return value.toLowerCase();
	}
	return value
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.replace(/_/g, '-')
		.toLowerCase();
};

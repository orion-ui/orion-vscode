export const toKebabCase = (value: string): string => {
	if (!value) {
		return value;
	}
	const normalized = value
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.replace(/[^a-zA-Z0-9]+/g, '-')
		.replace(/-{2,}/g, '-')
		.replace(/^-+|-+$/g, '')
		.toLowerCase();

	return normalized;
};

export const capitalize = (value: string): string => {
	return value.charAt(0).toUpperCase() + value.slice(1);
};

export const toPascalCase = (value: string): string => {
	if (!value) {
		return value;
	}

	const spaced = value
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/[^a-zA-Z0-9]+/g, ' ')
		.trim();

	if (!spaced) {
		return '';
	}

	return spaced
		.split(' ')
		.filter(Boolean)
		.map(word => capitalize(word))
		.join('');
};

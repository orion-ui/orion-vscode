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

export const toRgba = (color: string, alpha: number): string => {
	const rgb = color.match(/^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
	if (rgb) {
		const [, r, g, b] = rgb;
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	const rgba = color.match(/^rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([0-9.]+)\s*\)$/i);
	if (rgba) {
		const [, r, g, b] = rgba;
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
	if (hex) {
		const value = hex[1].length === 3
			? hex[1].split('').map(channel => channel + channel).join('')
			: hex[1];
		const r = parseInt(value.slice(0, 2), 16);
		const g = parseInt(value.slice(2, 4), 16);
		const b = parseInt(value.slice(4, 6), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	return color;
};

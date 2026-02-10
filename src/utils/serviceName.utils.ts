import { capitalize } from './string.utils';

const toWords = (value: string): string[] => {
	return value
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/[^a-zA-Z0-9]+/g, ' ')
		.trim()
		.split(/\s+/)
		.filter(Boolean);
};

export const normalizeServiceName = (input: string): NormalizedServiceName | null => {
	const raw = input.trim();
	if (!raw) {
		return null;
	}

	const words = toWords(raw);
	if (!words.length) {
		return null;
	}

	if (words.length && words[words.length - 1].toLowerCase() === 'service') {
		words.pop();
	}

	if (!words.length) {
		return null;
	}

	const pascalName = `${words.map(capitalize).join('')}Service`;
	const camelName = `${pascalName.charAt(0).toLowerCase()}${pascalName.slice(1)}`;

	return { pascalName, camelName };
};

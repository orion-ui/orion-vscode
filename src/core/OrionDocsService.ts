import type { RequestInfo, RequestInit, Response } from 'undici';

export interface OrionPropDoc {
	name: string
	type?: string
	description?: string
}

// eslint-disable-next-line orion-rules/no-export-type-in-ts
export type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface OrionComponentDocs {
	name: string
	props: OrionPropDoc[]
}

export const fetchOrionDocsAsync = async (baseUrl: string, componentName: string, fetcher: Fetcher): Promise<OrionComponentDocs | null> => {
	const url = `${baseUrl.replace(/\/$/, '')}/api/components/${componentName}.json`;

	try {
		const response = await fetcher(url, { headers: { Accept: 'application/json' } });

		if (!response.ok) {
			return null;
		}

		const payload = (await response.json()) as OrionComponentDocs;
		if (!payload || !payload.name) {
			return null;
		}

		return payload;
	}
	catch {
		return null;
	}
};

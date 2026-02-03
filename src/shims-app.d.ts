type NormalizedServiceName = {
	pascalName: string
	camelName: string
};

type ComponentIdentity = {
	name: string
	kebabName: string
	isShared: boolean
	fileBaseName: string
};

type ComponentUsageLocation = {
	uri: { fsPath: string, toString(): string }
	range: { start: { line: number, character: number }, end: { line: number, character: number } }
	lineText: string
};

type UsageSectionState = {
	visible: boolean
	status: 'idle' | 'loading' | 'ready' | 'error'
	message?: string
	locations: ComponentUsageLocation[]
};

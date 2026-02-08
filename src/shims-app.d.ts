declare global {

	namespace Service {
		type NormalizedName = {
			pascalName: string
			camelName: string
		};
	}

	namespace Component {
		type Identity = {
			name: string
			kebabName: string
			isShared: boolean
			fileBaseName: string
		};

		type UsageLocation = {
			uri: { fsPath: string, toString(): string }
			range: { start: { line: number, character: number }, end: { line: number, character: number } }
			lineText: string
		};
	}

	namespace SetupDetector {
		type TargetSection = 'template' | 'script';

		type Match = {
			offset: number
			length: number
			section: TargetSection
		};
	}

}

export {};

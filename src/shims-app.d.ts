import { type Uri } from 'vscode';

declare global {

	namespace Utils {
		type UsageLocation = {
			uri: Uri
			text: string
			line: number
			start: number
			end: number
		};
	}

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

		type UsageFileNode = {
			kind: 'file'
			uri: vscode.Uri
			label: string
			children: UsageLineNode[]
		};

		type UsageLineNode = {
			kind: 'line'
			uri: vscode.Uri
			text: string
			line: number
			start: number
			end: number
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

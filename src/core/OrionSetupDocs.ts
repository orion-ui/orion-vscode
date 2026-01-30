import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { parse as parseSfc } from '@vue/compiler-sfc';

// eslint-disable-next-line orion-rules/no-export-type-in-ts
export type SetupMemberVisibility = 'public' | 'protected' | 'private';

export interface OrionSetupPropertyDoc {
	name: string
	type?: string
	visibility?: SetupMemberVisibility
}

export interface OrionSetupMethodDoc {
	name: string
	type?: string
	visibility?: SetupMemberVisibility
}

export interface OrionSetupDocs {
	className: string
	properties?: OrionSetupPropertyDoc[]
	methods?: OrionSetupMethodDoc[]
}

const isPublic = (visibility?: SetupMemberVisibility): boolean => visibility === undefined || visibility === 'public';

const formatType = (type?: string): string => type ?? 'unknown';

const formatPropertyLine = (className: string, name: string, type?: string): string => {
	return `${name}: ${formatType(type)}`;
};

const formatMethodLine = (className: string, name: string, signature?: string): string => {
	if (signature) {
		const match = signature.match(/^(\(.*\))\s*=>\s*(.+)$/);
		if (match) {
			const [, params, returnType] = match;
			return `${name}${params}: ${returnType}`;
		}
		if (signature.startsWith('(')) {
			return `${name}${signature}`;
		}
	}
	return `${name}(): ${formatType(signature)}`;
};

const buildCodeBlock = (lines: string[]): string => `\n\n\`\`\`ts\n${lines.join('\n')}\n\`\`\``;

export const buildSetupHoverMarkdown = (docs: OrionSetupDocs): string => {
	const sections: string[] = [`**${docs.className}**`];
	const properties = (docs.properties ?? []).filter(prop => isPublic(prop.visibility) && prop.name !== 'defaultProps');
	const methods = (docs.methods ?? []).filter(method => isPublic(method.visibility));

	if (properties.length > 0) {
		const lines = properties.map(prop => formatPropertyLine(docs.className, prop.name, prop.type));
		sections.push('\n\n---\nPublic properties' + buildCodeBlock(lines));
	}
	else {
		sections.push('\n\n---\nPublic properties\n\n_No public properties_');
	}

	if (methods.length > 0) {
		const lines = methods.map(method => formatMethodLine(docs.className, method.name, method.type));
		sections.push('\n\n---\nPublic methods' + buildCodeBlock(lines));
	}
	else {
		sections.push('\n\n---\nPublic methods\n\n_No public methods documented._');
	}

	return sections.join('');
};

type SetupImportMatch = {
	className: string
	moduleSpecifier: string
};

const findSetupImport = (sourceFile: ts.SourceFile): SetupImportMatch | null => {
	let className: string | null = null;

	const findClassName = (node: ts.Node): void => {
		if (ts.isVariableDeclaration(node) && node.name.getText() === 'setup') {
			if (node.type && ts.isTypeReferenceNode(node.type) && ts.isIdentifier(node.type.typeName)) {
				className = node.type.typeName.text;
				return;
			}
			if (node.initializer && ts.isNewExpression(node.initializer)) {
				const expr = node.initializer.expression;
				if (ts.isIdentifier(expr)) {
					className = expr.text;
					return;
				}
			}
		}
		ts.forEachChild(node, findClassName);
	};

	findClassName(sourceFile);

	if (!className) {
		return null;
	}

	let moduleSpecifier: string | null = null;
	const findImport = (node: ts.Node): void => {
		if (!ts.isImportDeclaration(node)) {
			ts.forEachChild(node, findImport);
			return;
		}

		const clause = node.importClause;
		if (!clause || !ts.isStringLiteral(node.moduleSpecifier)) {
			return;
		}
		if (clause.name && clause.name.text === className) {
			moduleSpecifier = node.moduleSpecifier.text;
			return;
		}
		const bindings = clause.namedBindings;
		if (bindings && ts.isNamedImports(bindings)) {
			const match = bindings.elements.find(element => element.name.text === className);
			if (match) {
				moduleSpecifier = node.moduleSpecifier.text;
				return;
			}
		}
	};

	findImport(sourceFile);

	return moduleSpecifier
		? { className, moduleSpecifier }
		: null;
};

const loadCompilerOptions = (workspaceRoot?: string): ts.CompilerOptions => {
	if (!workspaceRoot) {
		return {};
	}

	const configPath = path.join(workspaceRoot, 'tsconfig.json');
	if (!fs.existsSync(configPath)) {
		return {};
	}

	const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
	if (configFile.error) {
		return {};
	}

	const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, workspaceRoot);
	return parsed.options ?? {};
};

const resolveModuleFile = (
	moduleSpecifier: string,
	containingFile: string,
	workspaceRoot?: string,
): string | null => {
	const compilerOptions = loadCompilerOptions(workspaceRoot);
	const resolved = ts.resolveModuleName(
		moduleSpecifier,
		containingFile,
		compilerOptions,
		ts.sys,
	).resolvedModule?.resolvedFileName;
	if (resolved && fs.existsSync(resolved)) {
		return resolved;
	}

	if (!moduleSpecifier.startsWith('.')) {
		return null;
	}

	const base = path.resolve(path.dirname(containingFile), moduleSpecifier);
	const candidates = [
		`${base}.ts`,
		`${base}.tsx`,
		`${base}.d.ts`,
		path.join(base, 'index.ts'),
		path.join(base, 'index.tsx'),
		path.join(base, 'index.d.ts'),
	];

	return candidates.find(candidate => fs.existsSync(candidate)) ?? null;
};

const getMemberVisibility = (member: ts.ClassElement): SetupMemberVisibility => {
	if (ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Private) {
		return 'private';
	}
	if (ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Protected) {
		return 'protected';
	}
	return 'public';
};

const formatMethodSignature = (member: ts.SignatureDeclarationBase): string | undefined => {
	const params = member.parameters.map((param) => {
		const name = param.name.getText();
		const type = param.type?.getText();
		return type ? `${name}: ${type}` : name;
	});
	const returnType = member.type?.getText();
	const signature = `(${params.join(', ')})`;
	return returnType ? `${signature} => ${returnType}` : signature;
};

const extractDocsFromClass = (sourceFile: ts.SourceFile, className: string): OrionSetupDocs | null => {
	let classDecl: ts.ClassDeclaration | undefined;

	const visit = (node: ts.Node): void => {
		if (ts.isClassDeclaration(node)) {
			if (node.name?.text === className) {
				classDecl = node;
				return;
			}
			const isDefaultExport = ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Default;
			if (!classDecl && isDefaultExport) {
				classDecl = node;
			}
		}
		ts.forEachChild(node, visit);
	};

	visit(sourceFile);

	if (!classDecl) {
		return null;
	}

	const properties: OrionSetupPropertyDoc[] = [];
	const methods: OrionSetupMethodDoc[] = [];

	for (const member of classDecl.members) {
		if (ts.isPropertyDeclaration(member) && member.name && ts.isIdentifier(member.name)) {
			properties.push({
				name: member.name.text,
				type: member.type?.getText(),
				visibility: getMemberVisibility(member),
			});
			continue;
		}

		if (ts.isMethodDeclaration(member) && member.name && ts.isIdentifier(member.name)) {
			methods.push({
				name: member.name.text,
				type: formatMethodSignature(member),
				visibility: getMemberVisibility(member),
			});
			continue;
		}
	}

	return {
		className: classDecl.name?.text ?? className,
		properties,
		methods,
	};
};

const extractSetupDocsFromScript = (
	scriptContent: string,
	containingFile: string,
	workspaceRoot?: string,
): OrionSetupDocs | null => {
	const sourceFile = ts.createSourceFile(
		containingFile,
		scriptContent,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TS,
	);
	const match = findSetupImport(sourceFile);
	if (!match) {
		return null;
	}

	const resolved = resolveModuleFile(match.moduleSpecifier, containingFile, workspaceRoot);
	if (!resolved) {
		return null;
	}

	const fileContents = fs.readFileSync(resolved, 'utf8');
	const moduleSource = ts.createSourceFile(
		resolved,
		fileContents,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TS,
	);

	return extractDocsFromClass(moduleSource, match.className);
};

export const extractSetupDocsFromSfc = (
	sfcContent: string,
	sfcFilePath: string,
	workspaceRoot?: string,
): OrionSetupDocs | null => {
	const { descriptor } = parseSfc(sfcContent);

	const scriptBlocks = [descriptor.script, descriptor.scriptSetup].filter(Boolean);
	for (const block of scriptBlocks) {
		if (!block?.content) {
			continue;
		}
		const docs = extractSetupDocsFromScript(block.content, sfcFilePath, workspaceRoot);
		if (docs) {
			return docs;
		}
	}

	return null;
};

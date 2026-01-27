## Context

The Orion UI Companion extension currently detects components for the sidebar view but lacks inline documentation. This design focuses on integrating a `vscode.HoverProvider` for `.vue` files, reusing the existing `OrionDocsProvider` and AST parsing logic from `orionComponentDetector.ts`.

## Goals / Non-Goals

**Goals:**
- Provide a responsive hover provider for Orion components and props in Vue SFC templates.
- Accurately map cursor positions to AST nodes using Vue's compiler metadata.
- Reuse existing documentation fetching and caching mechanisms.

**Non-Goals:**
- Implement hover support for `<script>` or `<style>` blocks.
- Provide auto-completion or IntelliSense (scoped to documentation display only).
- Support standalone `.html` or `.js` files (Vue only).

## Decisions

### 1. Re-use `@vue/compiler-dom` AST
- **Choice**: Use the template AST already parsed by `@vue/compiler-sfc` in the detector.
- **Rationale**: It provides precise `loc` (location) information including offsets, which is critical for mapping VS Code positions to template nodes.
- **Alternative**: Regex-based detection (too fragile for nested attributes/components).

### 2. Implementation of `findNodeAtOffset`
- **Choice**: Implement a recursive depth-first search that checks if the hover offset falls within the `node.loc.start.offset` and `node.loc.end.offset`.
- **Rationale**: Standard replacement for full-blown LSP node traversal for a lightweight extension.

### 3. "View in Sidebar" Command Link
- **Choice**: Use a `vscode.MarkdownString` with an `args`-encoded command link: `[View Documentation](command:orion.showComponentDocs?[...])`.
- **Rationale**: Provides seamless integration between the hover and the existing sidebar view.

## Risks / Trade-offs

- **[Performance]** → Parsing the AST on every hover could be expensive for large files. **Mitigation**: Cache the AST for the active editor and only re-parse if the document version changes.
- **[Overlapping Providers]** → Volar provides hovers for Vue. **Mitigation**: Ensure Orion hovers are clean and clearly focused on Orion-specific props to avoid noise.
- **[Coordinate Drift]** → Template blocks often start after `<script>` blocks. **Mitigation**: Correctly subtract `descriptor.template.loc.start.offset` from the absolute cursor offset before searching the AST.

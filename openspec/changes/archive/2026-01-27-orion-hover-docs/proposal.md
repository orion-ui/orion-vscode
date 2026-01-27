## Why

Developers using Orion UI components in Vue SFC files currently have to switch context to the sidebar or external documentation to view component props. This disrupts the development flow and slows down productivity.

## What Changes

- Add a `HoverProvider` for Vue files that displays Orion component and prop documentation.
- Enable coordinate mapping between VS Code editor positions and Vue template AST offsets.
- Improve discoverability of Orion component requirements directly within the editor.

## Capabilities

### New Capabilities
- `orion-hover-docs`: Provide prop documentation and component summaries directly in the Vue template on hover.

### Modified Capabilities
- (None)

## Impact

- `src/extension.ts`: New HoverProvider registration.
- `src/core/orionComponentDetector.ts`: Coordinate mapping and AST node finding.
- `src/providers/OrionDocsProvider.ts`: Used for doc fetching.
- `package.json`: Activation events and potential new dependencies for AST walking.

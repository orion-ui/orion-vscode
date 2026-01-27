## 1. Core Utilities

- [x] 1.1 Implement `findNodeAtOffset` in `src/core/orionComponentDetector.ts` to traverse the Vue AST
- [x] 1.2 Add logic to subtract template block offset from global position offset

## 2. Hover Provider Implementation

- [x] 2.1 Create `src/providers/OrionHoverProvider.ts` class matching the `vscode.HoverProvider` interface
- [x] 2.2 Implement document re-parsing with version-based caching for performance
- [x] 2.3 Integrate `OrionDocsProvider` to fetch component and prop documentation

## 3. Formatting & UI

- [x] 3.1 Implement Markdown formatting for component summaries and prop details
- [x] 3.2 Add the "View in Sidebar" command link to the hover tooltip

## 4. Integration & Registration

- [x] 4.1 Register the `OrionHoverProvider` in `src/extension.ts`
- [x] 4.2 Update `package.json` activation events and contribution points if necessary
- [x] 4.3 Verify hover functionality in a sample `.vue` file

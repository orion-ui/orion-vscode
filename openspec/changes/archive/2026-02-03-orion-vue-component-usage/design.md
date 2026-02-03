## Context

Orion’s VS Code extension currently exposes sidebar views for component and docs discovery, but it does not provide a context-aware view that surfaces usage locations for the component represented by the active Vue file. The change must integrate with existing sidebar infrastructure and use VS Code APIs for workspace search and navigation.

## Goals / Non-Goals

**Goals:**
- Show a sidebar section only when the active editor is focused on a `*.vue` file.
- Discover usage locations for the active component using the requested heuristics:
  - `Shared*` components: global registration search with `<SharedName` and `<shared-name` patterns.
  - Non-`Shared*` components: import-based discovery followed by usage matching.
- Provide click-to-navigate behavior to jump to the usage location in the source file.

**Non-Goals:**
- Full Vue SFC parsing or template AST analysis.
- Real-time incremental indexing beyond on-demand or debounced search.
- Cross-language or non-Vue component usage tracking.

## Decisions

- **Sidebar integration via TreeView rather than webview.**
  - *Why:* A TreeView aligns with existing sidebar patterns and provides built-in selection/activation events.
  - *Alternative considered:* A custom webview panel for richer UI, rejected to keep implementation consistent and lightweight.

- **Component identity derived from the active Vue file name with optional script fallback.**
  - *Why:* File names are reliable and easy to compute; any script-level `name` can be an enhancement later without blocking delivery.
  - *Alternative considered:* Always parse the SFC script block, deferred due to complexity.

- **Usage discovery via VS Code workspace search with focused filters.**
  - *Why:* The built-in search APIs can efficiently scan the workspace while restricting to Vue files.
  - *Alternative considered:* Project-wide index or language server integration, deferred due to scope and maintenance cost.

- **Navigation via `showTextDocument` and range reveal.**
  - *Why:* Standard VS Code navigation ensures compatibility across file types and editors.
  - *Alternative considered:* Custom editor decorations only, rejected since direct navigation is required.

## Risks / Trade-offs

- **False positives from text search** → Mitigate by restricting search to `*.vue` files and using tighter patterns.
- **Performance on large workspaces** → Mitigate with debounced search, caching per active file, and cancelable search tokens.
- **Naming ambiguity (kebab vs Pascal case)** → Mitigate by searching both `<ComponentName` and `<component-name` patterns.

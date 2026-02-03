## Why

Orion’s sidebar lacks a focused view that helps developers trace where a Vue component is used while they are working in a Vue file. Adding a contextual usage section reduces time spent searching and improves navigation during component maintenance.

## What Changes

- Add a sidebar section that appears when the active editor focuses a `*.vue` file and lists usage locations for the component in focus.
- Support component usage discovery via global registration heuristics for `Shared*` components, falling back to import-based discovery for others.
- Enable click-to-navigate from usage list items to the exact usage location in source files.

## Capabilities

### New Capabilities
- `orion-vue-component-usage`: Provide a contextual sidebar section for Vue component usage discovery and navigation.

### Modified Capabilities
- 

## Impact

- Affects sidebar view rendering, component detection logic, and workspace search usage.
- Introduces new usage discovery behavior for Vue components and navigation integrations with VS Code APIs.

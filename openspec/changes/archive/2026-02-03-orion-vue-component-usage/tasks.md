## 1. Usage discovery foundations

- [x] 1.1 Add component identity resolution for active `*.vue` file (file-based name, Shared detection)
- [x] 1.2 Implement exact-match tag search patterns for `Shared*` components (PascalCase + kebab-case)
- [x] 1.3 Implement exact-match import discovery for non-`Shared*` components and extract candidate files
- [x] 1.4 Add usage location scanning within candidate files with exact tag matching

## 2. Sidebar UI integration

- [x] 2.1 Extend sidebar tree model to include Vue component usage section and visibility rules
- [x] 2.2 Add tree items for usage results with labels, descriptions, and file location metadata
- [x] 2.3 Wire selection handler to navigate to the exact usage location in editor

## 3. Performance and resilience

- [x] 3.1 Add debounced refresh on active editor changes and cache results per component
- [x] 3.2 Add cancellation support for workspace search to avoid stale results
- [x] 3.3 Add fallback empty states and error handling for missing or invalid component context

## 4. Validation

- [x] 4.1 Add tests for Shared component exact-match search and non-Shared import discovery
- [x] 4.2 Add tests for sidebar visibility and navigation behavior

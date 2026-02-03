## Why

Developers need a fast, consistent way to scaffold Orion services from templates, but today it requires manual file creation and naming conventions. Adding a dedicated template-driven service generator in the extension reduces errors and speeds up project setup.

## What Changes

- Add a service creation workflow that formats user-provided names into PascalCase and camelCase with a single Service suffix.
- Support template discovery and selection, including workspace-local templates alongside the built-in default.
- Provide entry points via Explorer context menu and command palette with smart src folder targeting.
- Document template naming and variable conventions in the README.

## Capabilities

### New Capabilities
- `service-template-scaffolding`: Generate a new service file from a template with normalized naming and variable substitution.
- `service-template-selection`: Discover and select templates from workspace-local and built-in sources.
- `service-template-entrypoints`: Create services via Explorer context menu and command palette with src-aware path resolution.

### Modified Capabilities
<!-- None. -->

## Impact

- VS Code extension commands, menus, and file system interactions.
- Template parsing and replacement logic.
- README documentation for template usage.

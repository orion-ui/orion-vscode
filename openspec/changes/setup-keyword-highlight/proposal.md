## Why

Improve Orion UI developer experience by making `setup` usage instantly discoverable in `.vue` files and surfacing public API details on hover. This reduces time spent navigating to class definitions and helps validate usage in templates and scripts.

## What Changes

- Add semantic highlighting for the `setup` keyword in `.vue` files (template usage `setup.` and script declaration `const setup = ...`) with a configurable color and subtle background.
- Add hover content for highlighted `setup` tokens that shows the associated class name plus public properties and methods with their types.
- Expose a user setting to customize the highlight color (default `rgb(156, 105, 252)`) and derive background/opacity styling.

## Capabilities

### New Capabilities
- `orion-setup-keyword-highlight`: Highlight `setup` usages in `.vue` templates and scripts with configurable styling and hover details for the associated class.

### Modified Capabilities
- 

## Impact

- VS Code extension language features (semantic token/decoration provider and hover provider).
- Vue file parsing in core detection logic.
- Settings/configuration for highlight color.
- UI docs data used to build hover content.

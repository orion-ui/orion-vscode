## Context

The extension will add a new service scaffolding workflow that touches commands, Explorer menus, and filesystem/template handling. Existing template lives inside the extension, with optional workspace-local templates. Naming normalization and path resolution are critical to keep generated files consistent with project conventions.

## Goals / Non-Goals

**Goals:**
- Provide a consistent, template-driven service creation workflow across command palette and Explorer context menu entry points.
- Normalize user input into PascalCase and camelCase with a single Service suffix for template substitution.
- Discover and select templates from workspace-local overrides while always offering the built-in default.
- Resolve target folders using the nearest src ancestor or available src directories when invoked from the command palette.

**Non-Goals:**
- Introducing a new templating engine beyond simple variable substitution.
- Generating tests or updating exports/index files automatically.
- Supporting service generation outside src/services by default.

## Decisions

- **Name normalization strategy:** Parse arbitrary user input into words, then derive PascalCase and camelCase, and enforce a single Service suffix. This guarantees predictable identifiers regardless of input format.
  - *Alternatives considered:* Keep input as-is or only trim whitespace; rejected due to inconsistent class/function names.

- **Template discovery:** Offer a workspace-local template set under .orion/templates/services adjacent to the target src folder, plus the built-in default template as a fallback.
  - *Alternatives considered:* Only global templates or only workspace templates; rejected to preserve a default while allowing customization.

- **Entry points & path rules:**
  - Explorer context menu is enabled only for folders under src/services/** to reduce noise and misplacement.
  - Command palette flow uses the nearest src ancestor; if none, it searches for available src folders and prompts for selection.
  - *Alternatives considered:* Always prompt for any folder; rejected for inconsistent placement and extra steps.

- **Template variables:** Map the template placeholders to {ServiceName} (PascalCase) and {serviceName} (camelCase). This mirrors existing template patterns and keeps substitutions explicit.
  - *Alternatives considered:* More generic token names or handlebars-style templating; rejected for simplicity and to avoid new dependencies.

## Risks / Trade-offs

- **Multiple src folders** → Prompt fatigue or wrong selection. *Mitigation:* Prefer nearest src ancestor when available, otherwise list discovered options clearly.
- **Unclear user input** → Incorrect name formatting. *Mitigation:* Show a preview of the computed service names before creation.
- **Template mismatch** → Invalid placeholders in custom templates. *Mitigation:* Document supported variables and warn if unknown tokens remain after substitution.

## Context

The extension already provides Orion-specific hover and docs features, plus component detection for Vue files. We need an additional language feature that both highlights `setup` usage in Vue template and script sections and surfaces public API details on hover. This must fit the current VS Code extension architecture and reuse existing docs/parsing where possible.

## Goals / Non-Goals

**Goals:**
- Add a configurable highlight for `setup` in `.vue` files (template `setup.` and script `const setup = ...`).
- Use a hover provider to show the associated class name and its public properties/methods with types when hovering `setup`.
- Integrate with existing Orion docs/service parsing to avoid duplicating metadata sources.
- Ensure styling matches a configurable color, with background opacity and border radius.

**Non-Goals:**
- Highlight any other identifiers beyond `setup`.
- Support non-Vue files or non-Orion project structures.
- Provide full class documentation beyond public API fields and method signatures.

## Decisions

- Implement a focused semantic-token/decoration layer for `setup` rather than generic tokenization. This keeps scope tight and avoids unintended highlighting of other identifiers.
- Detect `setup` in the template section via simple lexical scanning of the `<template>` block for the `setup.` pattern, and in the script section via `const setup =` declaration detection. This aligns with the known structure and avoids a heavy Vue parser dependency.
- Reuse existing docs/service data to map `setup` usage to its class (e.g., `ConsultViewSetup`) and to extract public properties and methods with types for hover content. If necessary, extend the core docs service to expose only public members.
- Add a user setting (default `rgb(156, 105, 252)`) and derive background (same RGB with 0.1 alpha) and `4px` border radius in the decoration style, keeping consistent styling regardless of theme.

## Risks / Trade-offs

- Regex-based detection may miss edge cases or false positives in unusual formatting → Mitigation: keep patterns narrow to the known Orion structure and add tests for common variations.
- Hover data could be stale if docs metadata is incomplete → Mitigation: surface best-effort results and add unit tests tied to fixture docs.
- Decoration color may conflict with user themes → Mitigation: allow configuration with a clear default.

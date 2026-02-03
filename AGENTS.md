# AGENTS

## Code Style Conventions

- Indentation uses tabs.
- Use single quotes for strings.
- Keep semicolons at statement ends.
- Add a space before parentheses in function and method declarations.
- Prefer `const` and `readonly` whenever a binding is not reassigned.
- Use explicit return types for exported functions when the return type is not obvious.
- Async functions should use the `Async` suffix.
- Avoid redundant comments; keep only comments that explain non-obvious logic or intent.

## Utilities

- Shared helpers that can be reused across modules belong in `src/utils`.
- Utilities should be pure when possible and not depend on VS Code APIs unless necessary.
- Shared string helpers (like `capitalize`) belong in `src/utils/stringUtils.ts`.
- Global or shared types required by tooling should live in `src/shims-app.d.ts` instead of exported utility types.

## Structure

- Keep core logic in `src/core` and view-specific logic in `src/views`.
- Prefer type-only imports with `import type` when importing types.
- In `src/core`, expose functionality through classes with static methods (no top-level exported functions).
- Name core files with PascalCase to match their exported class names (e.g., `OrionDocsService.ts`).

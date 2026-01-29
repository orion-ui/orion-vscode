## Context

The current project lacks a `tasks.json` file, relying on VS Code's automatic detection of npm scripts. While `launch.json` exists, it references `npm: compile`, which works in many environments but can be brittle if task auto-detection fails or behaves differently in containerized environments like Antigravity. To ensure reliability, we need explicit configuration.

## Goals / Non-Goals

**Goals:**
-   Ensure F5 "Start Debugging" works reliably in VS Code and Antigravity.
-   Explicitly define build tasks to remove ambiguity.
-   Configure `launch.json` to properly reference these explicit tasks.

**Non-Goals:**
-   Changing the underlying build process (TypeScript compilation remains the same).
-   Adding new debug configurations beyond the standard extension host launch.

## Decisions

### Explicit `tasks.json`
We will create a `.vscode/tasks.json` file to explicitly define the compilation task.
**Rationale:**
-   Standardizes the build command execution.
-   Ensures the `problemMatcher` is correctly associated with the TypeScript compiler (tsc).
-   Removes dependency on VS Code's implicit npm script detection.

### Launch Configuration Linkage
We will update `.vscode/launch.json` (if necessary) to exactly match the label defined in `tasks.json`.
**Rationale:**
-   Ensures the `preLaunchTask` in `launch.json` resolves correctly to the defined task.

## Risks / Trade-offs

-   **Risk:** Duplicate task definitions if users also rely on auto-detection.
    -   *Mitigation:* The explicit `tasks.json` takes precedence and provides clear configuration.
-   **Risk:** `launch.json` changes might affect users who customized their setup.
    -   *Mitigation:* The changes are minimal (ensure `preLaunchTask` matches) and aligned with best practices.

## Migration Plan

No migration needed as this is a configuration enhancement. Existing users can continue to use the project; F5 experience will simply become more robust.

## Why

While the extension's F5 debugging configuration works correctly in standard VS Code, it needs to be verified and potentially adapted to function seamlessly within the Antigravity environment. This ensures that agents and users working in Antigravity can test the extension using standard debugging workflows.

## What Changes

-   Verify and adapt `.vscode/launch.json` to ensure compatibility with Antigravity's extension host environment.
-   Ensure build tasks in `.vscode/tasks.json` execute correctly within the Antigravity container/environment.

## Capabilities

### New Capabilities
-   `debug-config`: Enable F5 debugging support specifically for Antigravity.

### Modified Capabilities
-   (None)

## Impact

-   `.vscode/launch.json`: configuration tweaks for Antigravity.
-   `.vscode/tasks.json`: task execution validation.

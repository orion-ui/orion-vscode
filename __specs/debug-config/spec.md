# debug-config Specification

## Purpose
TBD - created by archiving change enable-f5-debug. Update Purpose after archive.
## Requirements
### Requirement: Antigravity Debug Configuration
The system SHALL provide a VS Code debug configuration that allows launching and debugging the extension with F5 within the Antigravity environment.

#### Scenario: F5 Launch in Antigravity
- **WHEN** user presses F5 or selects "Start Debugging" in Antigravity
- **THEN** the extension host launches with the Orion UI extension loaded
- **AND** breakpoints can be hit in the extension source code

### Requirement: Build Task Compatibility
The system SHALL ensure the build task executes correctly in the Antigravity environment before debugging launches.

#### Scenario: Pre-launch Build in Antigravity
- **WHEN** debugging is started in Antigravity
- **THEN** the build task runs automatically
- **AND** completes successfully without environment-specific errors


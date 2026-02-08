## ADDED Requirements

### Requirement: Explorer context menu entry point
The system SHALL provide a context menu command on Explorer folders whose paths match `src/services/**`.

#### Scenario: Folder under src/services
- **WHEN** the user right-clicks a folder within `src/services/**`
- **THEN** the service creation command is available

### Requirement: Command palette entry point
The system SHALL expose a command palette action for service creation that prompts for a target location.

#### Scenario: Command palette invocation
- **WHEN** the user runs the service creation command from the command palette
- **THEN** the system prompts for a target folder before creating the service

### Requirement: Resolve target src folder for command palette flow
The system SHALL use the nearest parent `src` folder of the selected target location. If no parent `src` exists, the system SHALL search the workspace for `src` folders and prompt the user to select one.

#### Scenario: Nearest src parent exists
- **WHEN** the user selects a folder under a `src` directory
- **THEN** the system chooses that nearest `src` as the base

#### Scenario: No parent src exists
- **WHEN** the user selects a folder outside any `src` directory
- **THEN** the system lists available `src` folders and asks the user to pick one
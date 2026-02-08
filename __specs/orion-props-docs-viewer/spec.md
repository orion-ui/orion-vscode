## ADDED Requirements

### Requirement: Fetch props documentation for Orion components
The extension SHALL retrieve props documentation for a selected Orion component.

#### Scenario: User selects a component
- **WHEN** the user selects an Orion component from the sidebar list
- **THEN** the extension fetches the props documentation for that component

### Requirement: Display props documentation
The extension SHALL display the props documentation for the selected Orion component within the extension UI.

#### Scenario: Documentation retrieval succeeds
- **WHEN** props documentation is available for the selected component
- **THEN** the extension shows the props and their descriptions in the UI

### Requirement: Handle documentation unavailable
The extension SHALL surface a clear empty or error state when props documentation cannot be retrieved.

#### Scenario: Documentation retrieval fails
- **WHEN** the documentation source is unreachable or missing data
- **THEN** the UI shows an error or empty state indicating documentation is unavailable

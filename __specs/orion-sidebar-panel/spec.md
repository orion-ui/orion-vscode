## ADDED Requirements

### Requirement: Provide Orion components sidebar view
The extension SHALL provide a sidebar view that lists Orion components detected in the active `.vue` file.

#### Scenario: Sidebar view is opened
- **WHEN** the user opens the Orion sidebar view
- **THEN** the view lists the detected Orion components for the active file

### Requirement: Support component selection
The sidebar view SHALL allow selecting a component to view its details.

#### Scenario: User clicks a component
- **WHEN** the user selects a component in the sidebar list
- **THEN** the extension shows the component details panel for that component

### Requirement: Indicate empty state
The sidebar view SHALL show an empty state when no Orion components are detected.

#### Scenario: No components detected
- **WHEN** the active `.vue` file contains no Orion components
- **THEN** the sidebar view displays an empty-state message

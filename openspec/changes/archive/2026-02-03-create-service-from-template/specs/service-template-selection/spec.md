## ADDED Requirements

### Requirement: Offer built-in default template
The system SHALL always include the built-in default template as an available option.

#### Scenario: Default template availability
- **WHEN** the template picker is shown
- **THEN** the built-in default template is listed

### Requirement: Discover workspace-local templates
The system SHALL detect templates located under .orion/templates/services that are adjacent to the selected src folder.

#### Scenario: Workspace-local templates exist
- **WHEN** a .orion/templates/services folder exists alongside the target src folder
- **THEN** the system lists templates from that folder in the template picker

### Requirement: Select a template to use
The system SHALL allow the user to pick one template from the combined list of built-in and workspace-local templates.

#### Scenario: User chooses a workspace template
- **WHEN** the user selects a template from the list
- **THEN** the chosen template is used for file generation

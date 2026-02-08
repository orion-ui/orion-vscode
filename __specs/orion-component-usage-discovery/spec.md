## ADDED Requirements

### Requirement: Detect Orion components in Vue SFC
The extension SHALL detect Orion UI components used within a `.vue` Single File Component and list them by component name.

#### Scenario: Vue SFC contains Orion tags
- **WHEN** a `.vue` file with Orion component tags is opened or saved
- **THEN** the extension identifies the Orion component names present in the template

### Requirement: Ignore non-Orion components
The extension SHALL exclude non-Orion components from the Orion component list.

#### Scenario: Vue SFC contains mixed components
- **WHEN** a `.vue` file includes both Orion and non-Orion component tags
- **THEN** only Orion components appear in the Orion list

### Requirement: Update component list on file change
The extension SHALL refresh the detected Orion component list when the active `.vue` file changes.

#### Scenario: Switching between Vue files
- **WHEN** the user switches the active editor to another `.vue` file
- **THEN** the Orion component list updates to match the new file

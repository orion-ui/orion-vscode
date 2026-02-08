## ADDED Requirements

### Requirement: Vue usage sidebar visibility
The system SHALL show a sidebar section for component usage only when the active editor is focused on a `*.vue` file.

#### Scenario: Non-Vue file focused
- **WHEN** the active editor focuses a non-`*.vue` file
- **THEN** the component usage section is not displayed

#### Scenario: Vue file focused
- **WHEN** the active editor focuses a `*.vue` file
- **THEN** the component usage section is displayed

### Requirement: Shared component global search
The system SHALL treat Vue components with names starting with `Shared` as globally registered and search the workspace for usage patterns using both PascalCase and kebab-case tags with exact tag name matching (no prefix matches).

#### Scenario: Shared component tag search
- **WHEN** the active component name is `SharedMetaButton`
- **THEN** the system searches for `<SharedMetaButton` and `<shared-meta-button` in Vue files

#### Scenario: Shared component exact match
- **WHEN** the active component name is `SharedMetaButton`
- **THEN** the system does not treat `<SharedMetaButtonVariant` or `<shared-meta-button-variant` as matches

### Requirement: Non-shared component import search
The system SHALL discover non-shared component usage by locating exact imports of the component (no prefix matches) and then resolving usage locations in the importing files.

#### Scenario: Component import discovery
- **WHEN** the active component name does not start with `Shared`
- **THEN** the system locates workspace files that import the component and lists usage locations for those files

#### Scenario: Component import exact match
- **WHEN** the active component name is `MetaButton`
- **THEN** the system does not treat imports of `MetaButtonVariant` as matches

### Requirement: Usage navigation
The system SHALL allow users to navigate to the exact usage location when selecting an item in the usage list.

#### Scenario: Navigate to usage location
- **WHEN** a user selects a usage list item
- **THEN** the system opens the target file and reveals the usage location

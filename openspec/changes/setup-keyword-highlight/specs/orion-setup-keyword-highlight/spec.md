## ADDED Requirements

### Requirement: Highlight `setup` in Vue templates
The system SHALL highlight the `setup` identifier in `.vue` template sections only when it is immediately followed by a dot (e.g., `setup.`).

#### Scenario: Template usage highlight
- **WHEN** a `.vue` file contains a `<template>` block with `setup.`
- **THEN** the `setup` token in that template usage is highlighted

### Requirement: Highlight `setup` declaration in Vue scripts
The system SHALL highlight the `setup` identifier in `.vue` script sections only when it is declared as `const setup =`.

#### Scenario: Script declaration highlight
- **WHEN** a `.vue` file contains a `<script>` block with `const setup =`
- **THEN** the `setup` token in that declaration is highlighted

### Requirement: Configurable highlight styling
The system SHALL provide a user setting to configure the `setup` highlight color with default `rgb(156, 105, 252)`.
The system SHALL render the highlight with a background using the same RGB value at 0.1 opacity and a border-radius of 4px.

#### Scenario: Default highlight styling
- **WHEN** the user has not customized the highlight color
- **THEN** `setup` highlights use `rgb(156, 105, 252)` foreground and a 0.1-opacity background of the same color with 4px border-radius

#### Scenario: Custom highlight styling
- **WHEN** the user sets a custom highlight color
- **THEN** `setup` highlights use the configured color with a 0.1-opacity background of the same color with 4px border-radius

### Requirement: Hover details for `setup`
The system SHALL provide hover content for highlighted `setup` tokens that includes the associated class name and its public properties and methods with their types.

#### Scenario: Hover shows public API
- **WHEN** the user hovers a highlighted `setup` token
- **THEN** the hover content lists the class name and only public properties and methods with their types

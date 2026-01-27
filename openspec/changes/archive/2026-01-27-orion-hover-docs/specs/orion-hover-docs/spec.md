## ADDED Requirements

### Requirement: Orion Component Hover
The system SHALL provide a hover provider for Vue SFC files that identifies Orion UI components at the cursor position.

#### Scenario: Hovering over a component tag
- **WHEN** the user hovers over an `<o-button>` tag in a `.vue` template
- **THEN** the system displays a hover tooltip containing the component name and a brief summary from the documentation

### Requirement: Orion Prop Hover
The system SHALL display detailed prop documentation when a user hovers over an attribute of an Orion component.

#### Scenario: Hovering over a prop attribute
- **WHEN** the user hovers over the `variant` attribute of an `<o-button>`
- **THEN** the system displays a hover tooltip containing the prop name, its expected type, and its description as defined in Orion documentation

### Requirement: Coordinate Mapping
The system SHALL correctly map VS Code editor positions to offsets within the Vue template block to ensure accurate node identification.

#### Scenario: Hovering in a complex template
- **WHEN** the user hovers over a component deeply nested in a template with multiple `<script>` and `<style>` blocks
- **THEN** the system identifies the correct AST node by subtracting the template start offset from the global file offset

### Requirement: Link to Sidebar Documentation
Hovers SHALL include a command link that allows the user to reveal the component in the Orion side panel for full documentation.

#### Scenario: Clicking the documentation link
- **WHEN** the user clicks the "View in Sidebar" link in the hover tooltip
- **THEN** the system opens the Orion Components view and selects the corresponding component

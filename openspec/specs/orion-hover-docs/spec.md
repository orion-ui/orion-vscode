# Spec: Orion Hover Documentation

## Context
Developers using Orion UI components in Vue SFC files currently have to open a side panel or sidebar to see prop documentation. This context switching slows down development. Providing documentation directly on hover within the editor improves efficiency and discoverability.

## Requirements
- **Trigger**: Hovering over an Orion component tag or prop in a `.vue` template.
- **Content**:
  - For tags: Component name and summary.
  - For props: Prop name, type, and description.
- **Accuracy**: Must handle kebab-case and PascalCase tags (e.g., `<o-button>` and `<OButton>`).
- **Integration**: Reuse existing `OrionDocsProvider` for fetching and caching.

## Design Decisions

### 1. Hover Provider Registration
Register a `vscode.HoverProvider` for the `vue` language. This provider will be activated when the user hovers over any text in a `.vue` file.

### 2. AST-Based Node Discovery
Since Vue templates can be complex, a simple regex is insufficient.
- Use `@vue/compiler-sfc` to extract the template block.
- Use `@vue/compiler-dom` to parse the template AST.
- Walk the AST to find the node whose `loc` (location) encompasses the hover position.

### 3. Coordinate Mapping
The AST offsets follow the template content. We must map the VS Code `Position` (line/character) to a global file offset, then subtract the template block's starting offset to search within the AST.

### 4. Link to Sidebar
Include a command link in the Markdown hover to reveal the component in the official Orion sidebar if the user needs more details.

## Implementation Plan

- [ ] **Utility**: Implement `findNodeAtOffset(ast, offset)` to return the innermost element or attribute at a given position.
- [ ] **Formatting**: Create a `MarkdownFormatter` to turn `OrionPropDoc` objects into clean, readable Markdown blocks.
- [ ] **Provider**: Create `OrionHoverProvider` class.
- [ ] **Registration**: Add `vscode.languages.registerHoverProvider('vue', ...)` to `extension.ts`.

## Risks
- **Overlapping Providers**: Volar (the official Vue extension) also provides hovers. We should ensure our hover content is succinct so as not to clutter the UI.
- **Parsing Performance**: Re-parsing the AST on every hover might be heavy. Consider caching the AST for the active document until it is edited.

## Added Requirements

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

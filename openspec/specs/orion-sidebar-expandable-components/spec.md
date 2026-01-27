## ADDED Requirements

### Requirement: Sidebar components are expandable
La sidebar Orion MUST afficher chaque composant comme un élément dépliable qui expose ses props et leurs types.

#### Scenario: Expanding a component shows props
- **WHEN** l’utilisateur clique sur un composant dans la sidebar
- **THEN** la liste des props de ce composant est affichée sous celui-ci avec le type visible

#### Scenario: Collapsing a component hides props
- **WHEN** l’utilisateur reclique sur le composant déjà déplié
- **THEN** la liste des props est masquée

### Requirement: Clicking a component does not open documentation
Le clic principal sur un composant MUST uniquement gérer l’expansion et MUST NOT ouvrir la documentation.

#### Scenario: Component click toggles expansion only
- **WHEN** l’utilisateur clique sur le nom du composant
- **THEN** l’état d’expansion est togglé sans ouvrir de nouvel onglet

### Requirement: Prop description is shown on prop click
Chaque prop MUST afficher une description détaillée lorsqu’elle est sélectionnée.

#### Scenario: Selecting a prop shows its description
- **WHEN** l’utilisateur clique sur une prop dans la liste
- **THEN** la description de la prop est affichée à proximité immédiate dans la sidebar

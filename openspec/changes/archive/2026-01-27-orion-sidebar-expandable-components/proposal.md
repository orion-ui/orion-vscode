## Why

La liste actuelle force l’ouverture d’un nouvel onglet pour voir les détails, ce qui casse la navigation rapide dans la sidebar. Nous voulons une exploration immédiate des composants et de leurs props, tout en gardant un accès direct à la documentation.

## What Changes

- La liste des composants Orion dans la sidebar devient dépliable (accordéon) avec affichage immédiat des props et de leur type.
- Le clic sur un composant n’ouvre plus une nouvelle fenêtre ; il déplie/ replie sa liste de props.
- Le clic sur une prop affiche sa description détaillée.
- Un icône “globe” sur chaque composant ouvre la documentation dans une webview en nouvel onglet.

## Capabilities

### New Capabilities
- `orion-sidebar-expandable-components`: Composants dépliables avec props et types visibles, et détail de description sur clic de prop.
- `orion-sidebar-docs-link`: Ouverture de la documentation d’un composant via une icône dédiée dans une webview.

### Modified Capabilities

## Impact

- UI/UX de la sidebar Orion (arbres, interactions, icônes).
- Providers et vues liés aux composants Orion.
- Webview de documentation et navigation interne.

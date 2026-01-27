## Why

Les équipes utilisant Orion UI manquent d’outillage pour comprendre rapidement quels composants Orion sont utilisés dans un fichier Vue et retrouver leurs props sans quitter l’éditeur. Un compagnon VS Code dédié améliore la DX, réduit les aller‑retour vers la doc et facilite l’adoption du framework maintenant que les projets Orion se multiplient.

## What Changes

- Ajout d’une extension VS Code “orion-vscode” centrée sur Orion UI.
- Nouvelle vue dans la sidebar listant les composants Orion détectés dans un composant `.vue`.
- Affichage contextuel de la documentation des props Orion pour les composants détectés.

## Capabilities

### New Capabilities
- `orion-component-usage-discovery`: Détecter et lister les composants Orion utilisés dans un fichier Vue (SFC).
- `orion-props-docs-viewer`: Récupérer et afficher la documentation des props des composants Orion dans la sidebar.
- `orion-sidebar-panel`: Fournir une vue d’extension dédiée pour afficher la liste des composants et leurs détails.

### Modified Capabilities
<!-- None -->

## Impact

- Nouveau projet d’extension VS Code avec contributions (views, commands, activation events).
- Analyse de fichiers `.vue` (parsing/AST) et indexation des composants Orion.
- Intégration à la documentation Orion UI (source en ligne ou bundle local).
- Potentiels impacts sur la performance d’analyse et la connectivité réseau si la doc est distante.

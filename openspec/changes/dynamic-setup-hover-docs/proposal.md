## Why

Le HoverProvider du setup affiche actuellement une documentation statique issue d’un JSON. Cela devient rapidement obsolète et ne reflète pas le contenu réel du fichier *Setup importé pour instancier `const setup`. Rendre la documentation dynamique améliore la fiabilité et réduit la maintenance.

## What Changes

- Générer la documentation du setup à partir du fichier *Setup importé (classe, propriétés, méthodes) plutôt que d’un JSON statique.
- Mettre à jour le flux de récupération des docs dans le provider pour s’aligner sur le contenu réel du code.
- Préserver l’expérience de hover existante (même point d’entrée, contenu mis à jour dynamiquement).

## Capabilities

### New Capabilities
- `orion-setup-hover-docs`: Documentation du setup générée dynamiquement depuis le fichier *Setup importé.

### Modified Capabilities
<!-- None -->

## Impact

- Code: src/core/orionSetupDocs.ts, src/providers/OrionSetupHighlightProvider.ts, src/providers/OrionHoverProvider.ts (si concerné)
- Données: src/data/orion-setup-docs.json (dépréciation ou usage réduit)
- Tests: src/test/suite/setupHover.test.ts (et tests associés aux docs)

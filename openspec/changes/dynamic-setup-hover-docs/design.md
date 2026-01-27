## Context

Le hover du setup affiche actuellement une documentation statique provenant de src/data/orion-setup-docs.json. Cette source n’est pas synchronisée avec le code réel du fichier *Setup importé pour instancier `const setup`, ce qui entraîne des divergences et des coûts de maintenance. Le besoin est d’extraire dynamiquement les propriétés et méthodes depuis le fichier concerné afin que le hover reflète la réalité du code.

## Goals / Non-Goals

**Goals:**
- Générer la documentation du setup à partir du fichier *Setup importé (classe, propriétés, méthodes) via une extraction de symboles.
- Conserver l’API existante du hover et la structure du contenu affiché.
- Éviter la maintenance d’un JSON statique pour le setup.

**Non-Goals:**
- Changer le rendu UI du hover ou le format du texte affiché.
- Supporter l’extraction multi-fichiers complexes (ex: mixins ou re-exports profonds) dans cette première version.
- Modifier la détection de `const setup` elle-même.

## Decisions

- **Source de vérité = fichier *Setup importé** : le système analysera le fichier TypeScript importé par le fichier courant pour instancier `const setup`, afin d’extraire la classe et ses membres.
  - *Alternative:* Continuer à maintenir un JSON statique. Rejeté car non fiable et coûteux.
- **Extraction via TypeScript API** : utiliser l’analyse AST/Type Checker déjà employée dans l’extension pour détecter les symboles (classe, propriétés, méthodes) et leurs visibilités.
  - *Alternative:* Parsing regex. Rejeté pour fragilité.
- **Fallback gracieux** : si l’analyse échoue (import introuvable ou type non résolu), fallback sur le JSON statique pour éviter une régression du hover.
  - *Alternative:* Ne rien afficher. Rejeté pour expérience utilisateur dégradée.

## Risks / Trade-offs

- **[Résolution d’import complexe] → Mitigation**: limiter au premier import direct résolu par le TypeScript Language Service et documenter les limites; logs de debug si introuvable.
- **[Performance sur gros fichiers] → Mitigation**: réutiliser le programme TS en cache et limiter l’extraction aux symboles nécessaires.
- **[Désynchronisation si fallback trop fréquent] → Mitigation**: rendre le fallback explicite dans les logs et améliorer la couverture des tests.

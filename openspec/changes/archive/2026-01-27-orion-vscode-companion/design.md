## Context

L’objectif est de créer une extension VS Code pour Orion UI qui détecte les composants Orion utilisés dans les fichiers Vue (SFC) et affiche leurs props dans une vue latérale. Le projet n’existe pas encore dans le dépôt et devra intégrer des contributions VS Code (views, commands, activation events). Les docs Orion peuvent être consultées à distance ou intégrées localement, ce qui impacte la performance et l’expérience hors‑ligne.

## Goals / Non-Goals

**Goals:**
- Définir une architecture d’extension VS Code claire pour la découverte des composants Orion dans les fichiers `.vue`.
- Proposer un mécanisme fiable pour la récupération et l’affichage de la documentation des props.
- Assurer une expérience fluide dans la sidebar (liste des composants + détails par composant).

**Non-Goals:**
- Implémenter l’ensemble des fonctionnalités Orion UI (scope limité à la découverte et la doc des props).
- Construire un moteur de linting complet ou un langage server Orion UI.
- Remplacer la documentation officielle Orion UI ou en fournir une version exhaustive hors‑ligne dès la V1.

## Decisions

1. **Analyse des fichiers `.vue` via AST**
   - **Choix**: Utiliser un parseur SFC (ex. `@vue/compiler-sfc`) pour obtenir le bloc `template` et parser l’AST afin d’extraire les tags composants.
   - **Alternatives**: Analyse regex naïve (plus simple mais fragile), ou LSP complet (plus puissant mais trop coûteux pour une première version).
   - **Rationale**: L’AST est plus fiable que la regex, tout en restant plus léger qu’un LSP complet.

2. **Source de vérité des composants Orion**
   - **Choix**: Maintenir une liste canonique des composants Orion (ex. JSON statique embarqué, ou récupéré depuis un endpoint officiel).
   - **Alternatives**: Déduire les composants depuis les imports locaux uniquement, ou scanner le projet.
   - **Rationale**: Une source canonique assure la cohérence et réduit les faux positifs.

3. **Documentation des props**
   - **Choix**: Récupération à la demande depuis un endpoint doc Orion UI, avec cache local en mémoire (et possibilité d’extension future pour cache disque).
   - **Alternatives**: Bundle complet de la doc en local (poids et maintenance), scraping à la volée.
   - **Rationale**: La récupération à la demande réduit le coût initial et garde la doc à jour.

4. **Vue VS Code dédiée**
   - **Choix**: Créer une vue de type TreeView (sidebar) listant les composants, avec un panneau de détail (webview ou description riche) pour afficher les props.
   - **Alternatives**: QuickPick/Command palette uniquement, ou Webview unique.
   - **Rationale**: TreeView est native, performante, et adaptée à la navigation. Un panneau de détail peut évoluer vers une webview si besoin.

## Risks / Trade-offs

- **[Performance d’analyse]** → Limiter l’analyse aux fichiers ouverts et déclencher sur save/active editor, avec debounce.
- **[Docs distantes indisponibles]** → Afficher un état “offline” et conserver un cache mémoire pour les docs déjà consultées.
- **[Faux positifs sur tags]** → Croiser l’AST avec la liste canonique et les imports lorsque possible.
- **[Évolution Orion UI]** → Prévoir un mécanisme de mise à jour de la liste de composants via une version de manifest.

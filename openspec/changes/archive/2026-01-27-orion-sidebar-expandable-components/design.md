## Context

La sidebar Orion liste actuellement les composants et ouvre les détails dans un nouvel onglet lors du clic. L’objectif est d’améliorer l’exploration rapide en rendant la liste dépliable et en affichant immédiatement les props et leurs types, tout en gardant un accès direct à la documentation via une webview.

## Goals / Non-Goals

**Goals:**
- Transformer la liste en structure dépliable par composant.
- Afficher les props et leur type immédiatement sous le composant.
- Afficher la description d’une prop au clic.
- Ajouter un icône “globe” qui ouvre la documentation dans une webview dédiée.

**Non-Goals:**
- Refonte globale du layout de la sidebar.
- Changer le contenu ou la source des docs existantes.
- Ajouter une recherche ou filtrage avancé dans cette itération.

## Decisions

- **Structure en arbre avec éléments dépliables (TreeView/TreeItem)** → permet une navigation native VS Code, ergonomique et compatible avec les interactions existantes.
  - *Alternative:* Liste custom HTML/React dans une webview. Rejetée pour éviter la complexité et garder la sidebar native.
- **Séparer actions “déplier” et “documentation”** via un bouton/icône dédiée → évite l’ouverture non désirée de la doc lors du clic sur le composant.
  - *Alternative:* Clic long ou menu contextuel. Rejeté pour réduire la friction.
- **Afficher la description de prop inline (ex: item child ou panneau secondaire)** → visibilité immédiate sans navigation supplémentaire.
  - *Alternative:* Tooltip. Rejeté car moins lisible pour des descriptions longues.

## Risks / Trade-offs

- **[Risque]** Surcharge visuelle si beaucoup de props → **Mitigation:** collapse par défaut, limiter l’expansion à un composant à la fois si nécessaire.
- **[Risque]** Complexité d’état UI (sélection, expansion) → **Mitigation:** centraliser l’état dans le provider de la vue et réutiliser les events VS Code.
- **[Trade-off]** Utiliser la TreeView limite le rendu custom → **Mitigation:** exploiter descriptions et icons pour garder la lisibilité.

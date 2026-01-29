## Context

Le développement de services dans l'écosystème Orion UI nécessite une synchronisation forte entre les fichiers API (`src/api/*Api.ts`) et les fichiers Service (`src/services/**/*Service.ts`). Actuellement, cette synchronisation est manuelle. L'objectif est d'offrir une interface visuelle dans VS Code pour automatiser ces tâches tout en restant dans un cadre architectural générique ("Orion Architecture") capable d'accueillir d'autres outils à l'avenir.

## Goals / Non-Goals

**Goals:**
- Offrir un nouveau point d'entrée "Orion" dans la barre d'activité de VS Code.
- Implémenter la première fonctionnalité : "Service API Helper".
- Permettre l'insertion et la suppression de méthodes d'API dans un service avec synchronisation visuelle (checkboxes).
- Garantir un ordre strict dans le fichier Service (méthodes d'API en premier).

**Non-Goals:**
- Générer la logique métier complexe à l'intérieur des méthodes (fournir uniquement le boilerplate d'appel API).
- Gérer les conflits de fusion complexes si le code a été modifié manuellement de manière importante sans respecter les commentaires de référence.

## Decisions

### 1. View Container VS Code générique
- **Décision** : Enregistrer un `viewContainer` avec l'ID `orion-architecture` dans `package.json`.
- **Raison** : Permet de regrouper toutes les futures vues liées à l'architecture Orion sous une seule icône, évitant de polluer la barre d'activité.

### 2. Modèle de données pour la TreeView
- **Décision** : Utiliser un `TreeDataProvider` qui scanne `src/api` récursivement.
- **Raison** : Nécessaire pour afficher l'arborescence des fichiers API et leurs méthodes respectives.

### 3. Détection de l'implémentation via commentaires de référence
- **Décision** : Utiliser des commentaires de type `// @api-method: <MethodName>` pour délimiter les blocs de code.
- **Raison** : C'est une méthode simple, robuste et lisible par l'humain pour identifier quel code appartient à quelle API, facilitant la suppression et la réorganisation sans analyse AST complexe à chaque modification.

### 4. Insertion de code ordonnée
- **Décision** : Rechercher la position de la classe dans le fichier Service et insérer les nouvelles méthodes au début de la classe (après le constructeur si présent).
- **Raison** : Respecte l'exigence d'avoir les méthodes d'API en premier.

## Risks / Trade-offs

- **[Risk]** : Performance lors du scan de nombreux fichiers API.
  - **Mitigation** : Mettre en cache la liste des API et ne rafraîchir que sur changement de focus ou modification de fichier.
- **[Risk]** : Modification manuelle des commentaires de référence par l'utilisateur.
  - **Mitigation** : Si le commentaire est supprimé, la méthode sera considérée comme non-implémentée (décochée) et une nouvelle insertion pourrait créer un doublon. On informera l'utilisateur via la doc.
- **[Risk]** : Analyse de signatures de méthodes complexe.
  - **Mitigation** : Utiliser un parser TypeScript léger (ex: regex robustes ou un petit parser AST si nécessaire) pour extraire `static methodName(...args)`.

## Migration Plan

1. Mettre à jour `package.json` pour déclarer le container et la vue.
2. Créer les classes `OrionTreeDataProvider` et `ApiTreeItem`.
3. Implémenter le service de manipulation de fichiers (recherche d'API, détection dans Service).
4. Ajouter les commandes VS Code pour l'implémentation/suppression.

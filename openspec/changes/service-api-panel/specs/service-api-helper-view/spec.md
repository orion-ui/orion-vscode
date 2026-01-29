## ADDED Requirements

### Requirement: Service API Helper Tree View
Le système SHALL afficher une vue de type arbre listant les API disponibles dans `src/api/**/*Api.ts`.

#### Scenario: Display API list
- **WHEN** l'utilisateur ouvre la sidebar Orion
- **THEN** la vue "Service API Helper" affiche la liste des fichiers API (ex: UserApi, ProductApi)

### Requirement: API Method Accordion
Chaque API dans la liste SHALL pouvoir être dépliée pour afficher ses méthodes publiques.

#### Scenario: Expand API methods
- **WHEN** l'utilisateur clique sur une API dans la liste
- **THEN** elle se déplie pour afficher toutes les méthodes statiques (ou exportées) disponibles dans le fichier API correspondant

### Requirement: Contextual Selection
La vue SHALL se synchroniser avec le fichier Service actuellement ouvert dans l'éditeur.

#### Scenario: Sync with active service
- **WHEN** l'utilisateur ouvre un fichier `src/services/UserService.ts`
- **THEN** la vue identifie que le service courant est `UserService` et prépare l'affichage de l'état d'implémentation

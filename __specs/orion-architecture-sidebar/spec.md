## ADDED Requirements

### Requirement: Orion Architecture View Container
L'extension SHALL enregistrer un nouveau "View Container" dans la barre d'activité (Activity Bar) de VS Code.

#### Scenario: View container visibility
- **WHEN** l'extension est chargée
- **THEN** une nouvelle icône (logo Orion) apparaît dans la barre d'activité de VS Code

### Requirement: Generic Sidebar Host
Le View Container SHALL être capable d'héberger plusieurs vues indépendantes liées à l'architecture Orion.

#### Scenario: Multiple views display
- **WHEN** le conteneur Orion est ouvert
- **THEN** il peut afficher une ou plusieurs Tree Views (ex: Service API Helper, et potentiellement d'autres vues futures)
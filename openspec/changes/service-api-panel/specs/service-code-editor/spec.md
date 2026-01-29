## ADDED Requirements

### Requirement: Method Implementation Injection
Le système SHALL permettre d'insérer le code d'une méthode d'API dans le service via un clic.

#### Scenario: Inject method code
- **WHEN** l'utilisateur clique sur une méthode non implémentée (ou coche la case)
- **THEN** le code boilerplate correspondant est inséré dans la classe du Service avec un commentaire de référence `// @api-method: <ApiName>.<MethodName>`

### Requirement: Method Removal
Le système SHALL permettre de retirer l'implémentation d'une méthode d'API.

#### Scenario: Remove method code
- **WHEN** l'utilisateur décoche une méthode déjà implémentée
- **THEN** le bloc de code délimité par le commentaire de référence est supprimé du fichier Service

### Requirement: Code Organization
Les méthodes implémentées depuis les API SHALL être ordonnées en premier dans la classe du Service, suivies des méthodes propres au service.

#### Scenario: Auto-ordering on insertion
- **WHEN** une nouvelle méthode d'API est insérée
- **THEN** elle est placée au début de la liste des méthodes d'API, maintenue avant les méthodes "custom" du service

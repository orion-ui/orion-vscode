## ADDED Requirements

### Requirement: Documentation icon opens webview
Chaque composant MUST afficher un icône “globe” qui ouvre la documentation dans une webview dédiée.

#### Scenario: Clicking globe icon opens docs tab
- **WHEN** l’utilisateur clique sur l’icône “globe” d’un composant
- **THEN** la documentation du composant s’ouvre dans une webview en nouvel onglet

### Requirement: Docs icon does not affect expansion
Le clic sur l’icône de documentation MUST être indépendant de l’état d’expansion du composant.

#### Scenario: Docs icon click keeps component state
- **WHEN** l’utilisateur clique sur l’icône “globe”
- **THEN** l’état d’expansion du composant reste inchangé

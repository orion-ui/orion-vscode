## ADDED Requirements

### Requirement: Implementation Status Detection
Le système SHALL analyser le fichier Service actif pour détecter quelles méthodes d'API sont déjà implémentées.

#### Scenario: Detect implemented methods
- **WHEN** un service est ouvert
- **THEN** les méthodes de la vue API sont marquées comme "implémentées" (case cochée) si elles sont trouvées dans le code du service (via commentaire ou signature)

### Requirement: Implemented Methods Priority
Les méthodes d'API déjà implémentées SHALL être listées en haut de la vue (ou dans une section dédiée).

#### Scenario: Priority listing
- **WHEN** des méthodes sont détectées comme implémentées
- **THEN** elles apparaissent en haut de la liste de leur API respective (ou dans un groupe "Already Implemented")

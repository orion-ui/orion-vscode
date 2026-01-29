# orion-setup-hover-docs Specification

## Purpose
TBD - created by archiving change dynamic-setup-hover-docs. Update Purpose after archive.
## Requirements
### Requirement: Setup hover documentation is generated from the imported *Setup file
Le système SHALL générer la documentation affichée au hover du setup à partir du fichier *Setup importé pour instancier `const setup`, et non d’une source statique.

#### Scenario: Documentation generated from imported setup
- **WHEN** un fichier contient l’instanciation de `const setup` via un import d’un fichier *Setup
- **THEN** le hover affiche les propriétés et méthodes extraites du type réel du setup importé

### Requirement: No hover content when dynamic extraction fails
Le système SHALL n’afficher aucune documentation lorsque l’import *Setup ne peut pas être résolu ou que l’analyse des symboles échoue.

#### Scenario: Dynamic extraction failure
- **WHEN** l’import *Setup est introuvable ou le type ne peut pas être résolu
- **THEN** le hover n’affiche aucun contenu de documentation

### Requirement: Visibility is reflected in the hover content
Le système SHALL afficher la visibilité (public/protected/private) des propriétés et méthodes du setup lorsque ces informations sont disponibles.

#### Scenario: Visibility displayed
- **WHEN** une propriété ou méthode du setup a une visibilité déterminable
- **THEN** le hover affiche cette visibilité dans la documentation


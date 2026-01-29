## Why

Implementer des appels d'API dans les services est aujourd'hui un processus manuel et répétitif qui nécessite de jongler entre plusieurs fichiers. Les développeurs doivent manuellement copier les signatures de méthodes des fichiers API et générer le boilerplate correspondant dans les fichiers Service.

Cette fonctionnalité vise à automatiser ce processus via un panneau latéral dédié (Sidebar) qui permet d'explorer les API disponibles et de les implémenter (ou retirer) d'un dossier Service en un clic, tout en maintenant une structure de code propre et cohérente.

## What Changes

- **Nouveau View Container "Orion UI"** : Un conteneur latéral complet (Sidebar) générique conçu pour héberger diverses fonctionnalités d'aide au développement liées à l'architecture Orion UI.
- **Vue "Service API Helper"** : La première vue intégrée à ce conteneur, dédiée à l'exploration et l'implémentation des API.
- **Exploration des API** : Liste en accordéon de tous les fichiers `src/api/*Api.ts` et de leurs méthodes.
- **Contexte Intelligent** : Le panneau s'active et se synchronise automatiquement lorsqu'un fichier `src/services/**/*Service.ts` est ouvert.
- **Gestion de l'Implémentation** :
    - Affichage distinct des méthodes déjà implémentées en haut de la liste.
    - Case à cocher pour chaque méthode indiquant son statut d'implémentation.
    - Implémentation automatique d'une méthode lors d'un clic (avec injection de code boilerplate).
    - Retrait automatique du code lors du décochage d'une méthode.
- **Organisation Automatique du Code** :
    - Les méthodes implémentées depuis les API sont regroupées en haut du fichier Service.
    - Utilisation de commentaires de référence (`// @api-method: ...`) pour identifier et délimiter les blocs de code générés.
    - Les méthodes propres au service (non issues des API) sont placées après les méthodes d'API.

## Capabilities

### New Capabilities
- `orion-architecture-sidebar` : Conteneur de vue (View Container) VS Code générique pour l'architecture Orion.
- `service-api-helper-view` : Vue spécifique (Tree View) intégrée au conteneur pour l'exploration et l'implémentation des API.
- `service-implementation-sync` : Moteur de détection analysant le fichier Service courant pour identifier quelles méthodes d'API sont déjà implémentées.
- `service-code-editor` : Logique de manipulation de code pour insérer, supprimer et réordonner les méthodes dans le fichier Service en respectant la structure définie.

### Modified Capabilities
- Aucun (Nouvelle fonctionnalité isolée).

## Impact

- **Extension VS Code** : Ajout de points de contribution dans `package.json` (view container, views, commands).
- **Filesystem** : Lecture récursive de `src/api` et `src/services`.
- **Parsing** : Analyse de code TypeScript pour extraire les méthodes et leurs signatures.

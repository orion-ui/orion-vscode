## 1. Setup & VS Code Contributions

- [x] 1.1 Déclarer le `viewContainer` "Orion Architecture" dans `package.json`
- [x] 1.2 Déclarer la vue "Service API Helper" (`orion.serviceApiHelper`) dans le container
- [x] 1.3 Ajouter les commandes nécessaires (`orion.implementApiMethod`, `orion.removeApiMethod`, `orion.refreshApiViews`) dans `package.json`
- [x] 1.4 Ajouter les icônes nécessaires pour le container et les états de checkbox

## 2. Infrastructure de Données (Tree View)

- [x] 2.1 Implémenter `OrionTreeDataProvider` pour gérer les vues multi-usage
- [x] 2.2 Implémenter le scan récursif de `src/api/**/*Api.ts`
- [x] 2.3 Implémenter l'extraction des méthodes d'API (parsing TypeScript/Regex)
- [x] 2.4 Créer la structure `ApiTreeItem` (API File vs Method) avec support des accordéons

## 3. Logique de Synchronisation et Contexte

- [x] 3.1 Implémenter le listener `onDidChangeActiveTextEditor` pour détecter les fichiers Service
- [x] 3.2 Implémenter `ServiceImplementationScanner` pour détecter les méthodes déjà implémentées via les commentaires `// @api-method:`
- [x] 3.3 Mettre à jour l'état visuel de la Tree View (check/uncheck + priorité en haut de liste) selon le service actif

## 4. Manipulation de Code (Service Editor)

- [x] 4.1 Implémenter `ServiceCodeManager` pour l'injection de code boilerplate
- [x] 4.2 Implémenter la logique de suppression de code basée sur les commentaires de référence
- [x] 4.3 Implémenter le tri automatique des méthodes dans la classe du Service (APIs d'abord)
- [x] 4.4 Gérer l'ajout/suppression des imports nécessaires (ex: import de l'API dans le service)

## 5. Polissage et Tests

- [x] 5.1 Vérifier la réactivité de l'UI lors du switch entre services
- [x] 5.2 Tester les cas limites (classe vide, classe avec constructeur, méthodes déjà présentes sans commentaires)
- [x] 5.3 S'assurer que le container est prêt à accueillir d'autres vues "Orion"

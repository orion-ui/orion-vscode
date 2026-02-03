## 1. Service name normalization

- [x] 1.1 Define utilities to parse arbitrary input into PascalCase and camelCase with a single Service suffix
- [x] 1.2 Add preview/validation messaging for computed service names in the creation flow

## 2. Template discovery and selection

- [x] 2.1 Load built-in default template metadata and content
- [x] 2.2 Detect workspace-local templates under .orion/templates/services adjacent to the chosen src folder
- [x] 2.3 Implement template picker combining built-in and workspace-local templates

## 3. Entry points and path resolution

- [x] 3.1 Add Explorer context menu command visible only under src/services/**
- [x] 3.2 Add command palette command to create a service and prompt for target location
- [x] 3.3 Resolve target src folder using nearest parent src or workspace src discovery

## 4. File generation and substitution

- [x] 4.1 Replace template variables {ServiceName}/{serviceName} and write the new service file
- [x] 4.2 Warn when unknown placeholders remain in the output template

## 5. Documentation

- [x] 5.1 Add README documentation for service templates, naming conventions, and available variables

# Orion UI Companion

A VS Code companion extension to improve developer experience for Orion UI projects.

---

## Component usage navigation

The Orion Components view includes a **Component Usage** section when a `.vue` file is focused.

- Left-click a usage item to navigate to the location in the active editor.
- Right-click a usage item and choose **Open Component Usage Beside** to open it in a new editor column while keeping focus in the sidebar, so you can open multiple locations quickly.

---

## Service API Helper view

The Orion sidebar includes a **Service API Helper** tree view to assist when implementing services.

### API list

When the Orion sidebar is opened, the view lists API files found in `src/api/**/*Api.ts` (for example, `UserApi` and `ProductApi`).

### API method accordion

Each API entry can be expanded to show all available static or exported methods from the corresponding API file.

### Contextual selection

When you open a service file (for example `src/services/UserService.ts`), the view synchronizes to the active service and prepares the method implementation status accordingly.

---

## Service templates

Use the command palette or the Explorer context menu under `src/services/**` to scaffold a new service from a template.

### Naming conventions

The service name you enter is normalized into two values:

- `__ServiceName__`: PascalCase with a single `Service` suffix (ex: `BillingService`).
- `__serviceName__`: camelCase equivalent of `__ServiceName__` (ex: `billingService`).

The extension shows a preview of these computed names before creating the file.

### Built-in template

The built-in default template ships with the extension and is always available.

### Workspace templates

You can add custom templates in `.orion/templates/services/**` next to your `src` folder. For example:

```
project-root/
  src/
  .orion/
    templates/
      services/
        my-service.ts
```

Templates can include the `__ServiceName__` and `__serviceName__` placeholders, which are replaced during creation. For workspace templates, any unknown placeholders trigger prompts so you can provide values on the fly.

### Default template source (example)

Copy/paste and customize as needed. This example includes a custom placeholder `__CustomNote__` to demonstrate the prompt flow for user-defined values.

```typescript
/**
 * @orion/template-name The name of your template
 * @orion/template-desc The purpose of your template
 */

// __CustomNote__

class __ServiceName__ {
}

// Singleton instance initialized only when first requested
let __serviceName__Singleton: __ServiceName__;

export function use__ServiceName__ (newInstance = false) {
	if (newInstance) {
		return new __ServiceName__();
	}
	else if (!__serviceName__Singleton) {
		__serviceName__Singleton = new __ServiceName__();
	}

	return __serviceName__Singleton;
}

```

---

## Performance checks

Run a quick local benchmark:

```
npm run perf
```


## Development

```
npm install
npm run compile
```

## Limitations

- Only components present in the canonical list (or overridden list) are detected.
- Remote docs are fetched on demand and cached in memory only.

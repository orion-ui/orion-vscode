# Orion UI Companion

A VS Code companion extension to improve developer experience for Orion UI projects. It detects Orion UI components used in Vue SFC files and shows their props documentation.

## Features

- Sidebar view listing Orion components found in the active `.vue` file.
- Component detail panel with props documentation.
- Optional remote docs fetch with in-memory cache.

## Usage

1. Open a `.vue` file.
2. Open the **Orion Components** view in the Explorer sidebar.
3. Select a component to see its props documentation.

## Configuration

- `orion.docsSource`: `remote` (default) or `bundled`.
- `orion.docsBaseUrl`: Base URL for remote docs API. Default: `https://orion-ui.org`.
- `orion.componentsList`: Optional override list of Orion component tags (kebab-case).

### Remote docs endpoint

The extension expects a JSON payload at:

```
{docsBaseUrl}/api/components/{componentName}.json
```

The JSON should match:

```
{
  "name": "orion-button",
  "props": [
    { "name": "variant", "type": "string", "description": "..." }
  ]
}
```

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

## 1. Project Setup

- [x] 1.1 Initialize VS Code extension project scaffold
- [x] 1.2 Add dependencies for Vue SFC parsing and Orion docs fetching
- [x] 1.3 Configure extension manifest (commands, views, activation events)

## 2. Orion Component Discovery

- [x] 2.1 Implement Vue SFC parsing to extract template AST
- [x] 2.2 Build Orion component list resolver (canonical list + filtering)
- [x] 2.3 Wire detection to active editor and file save events

## 3. Sidebar View

- [x] 3.1 Create TreeView data provider for detected components
- [x] 3.2 Implement empty state handling for no detected components
- [x] 3.3 Handle component selection events

## 4. Props Documentation Viewer

- [x] 4.1 Implement docs fetcher (endpoint + in-memory cache)
- [x] 4.2 Render props documentation in detail panel
- [x] 4.3 Display error/empty states when docs are unavailable

## 5. Quality & Validation

- [x] 5.1 Add basic tests for component detection and docs retrieval
- [x] 5.2 Verify performance with large `.vue` files
- [x] 5.3 Document usage and limitations in README

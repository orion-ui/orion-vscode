## 1. Configuration & Styling

- [x] 1.1 Add user setting for `setup` highlight color with default `rgb(156, 105, 252)`
- [x] 1.2 Implement decoration style creation using configurable color, 0.1 opacity background, and 4px border radius

## 2. Setup Token Detection

- [x] 2.1 Add template-section detection for `setup.` occurrences in `.vue` files
- [x] 2.2 Add script-section detection for `const setup =` declarations in `.vue` files
- [x] 2.3 Add unit tests covering template and script detection patterns

## 3. Highlight & Hover Integration

- [x] 3.1 Create/update provider to apply decorations for detected `setup` tokens
- [x] 3.2 Extend hover provider to show class name plus public properties/methods with types for `setup`
- [x] 3.3 Add tests for hover content and public-only filtering

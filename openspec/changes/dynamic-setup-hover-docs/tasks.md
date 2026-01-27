## 1. Setup docs extraction pipeline

- [x] 1.1 Inspect current setup hover flow and identify entry points for docs generation
- [x] 1.2 Add TypeScript-based symbol extraction for the imported *Setup type
- [x] 1.3 Ensure visibility (public/protected/private) is captured for members

## 2. Hover integration and behavior

- [x] 2.1 Wire dynamic docs into the setup hover provider output
- [x] 2.2 Suppress hover content when extraction fails (no fallback)
- [x] 2.3 Update tests to cover dynamic extraction and no-content-on-failure

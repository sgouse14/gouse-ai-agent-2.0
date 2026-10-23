# TypeScript Check Baseline

## Check command

Install the locked dependencies with `bun install --frozen-lockfile`, then run `bun run typecheck`.
The `typecheck` script runs `tsc --noEmit`. The existing `lint` script is retained for compatibility, and the Saqlain Security Tests workflow invokes the dedicated `typecheck` script.

## Snapshot result (2026-10-23)

- The repository declares TypeScript `^5.7.3`.
- In the uploaded source snapshot, a direct type-check could not complete meaningfully because `node_modules` was absent.
- Unresolved module diagnostics included `react`, `react-dom/client`, `lucide-react`, Firebase modules, `xlsx`, `jspdf`, and `jspdf-autotable`. Missing declarations can cause cascading JSX and implicit-`any` diagnostics, so those diagnostics should not be treated as confirmed source defects until dependencies are installed.
- Dependency installation failed in the inspection environment with an `EAI_AGAIN` DNS resolution error when reaching the npm registry. A clean dependency-backed recheck could not be performed there.
- The current `tsconfig.json` includes only `src`; it does not type-check root `server.ts` or `server/**/*.ts`. The existing build bundles the server with esbuild, but that is not a substitute for a server-side TypeScript check.

## Follow-up

Run the check in CI after locked dependency installation. Fix diagnostics that remain with dependencies available. Consider adding a separate server TypeScript configuration after reviewing Node.js type/module settings and the server's runtime conventions.

No application source has been changed to silence diagnostics or relax strict compiler options.

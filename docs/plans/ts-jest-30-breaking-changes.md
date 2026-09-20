# ts-jest 30.0.0 Breaking-Change Proposal

## Goal

Use v30 to remove accumulated compatibility debt, establish explicit supported boundaries, and correct inconsistent runtime contracts without rewriting the transformer implementation at the same time.

## Recommended Release Contract

- Require Jest 30.
- Require Node 20 or newer; validate Node 20, 22, and 24 in CI.
- Require TypeScript 5.4 or newer while retaining `<7` until TypeScript 7 exposes the compiler APIs ts-jest needs.
- Keep package runtime CommonJS for v30; treat a package-format conversion as a separate project.
- Keep current transformer implementation internally, even if it remains under `src/legacy`; remove public compatibility paths independently from internal relocation.

## Breaking Changes To Include

### 1. Remove Previously Announced Deprecations

- Remove transformer-level `isolatedModules`; accept only `compilerOptions.isolatedModules` through tsconfig.
- Remove `RawCompilerOptions`; type inline compiler options as `TsConfigJson.CompilerOptions`.
- In `src/legacy/compiler/ts-compiler.ts`, remove the deprecated native `ts.transpileModule` branch in `_transpileOutput` (currently around lines 469-496) and route isolated compilation through the checked implementation in `src/transpilers/typescript/transpile-module.ts`.
- Remove CLI `--babel` and deprecated `--allow-js`; retain current `--js` forms.
- Remove deprecated `createJestPreset` positional API.
- Remove deprecated public aliases: `TsJestGlobalOptions`, `ProjectConfigTsJest`, `TransformOptionsTsJest`, `GlobalConfigTsJest`, `InitialOptionsTsJest`, and `TsJestPresets`. Define `TsJestTransformerOptions` directly rather than aliasing a deprecated type.
- Remove deprecated preprocessor compatibility entrypoint.

### 2. Finish Configuration Migration

- Accept ts-jest options only in Jest transform tuples.
- Remove support for `globals['ts-jest']`.
- Remove old aliases handled by `backportJestConfig`: `__TS_CONFIG__`, `__TRANSFORM_HTML__`, `typeCheck`, `tsConfigFile`, `tsConfig`, `enableTsDiagnostics`, `useBabelrc`, and `skipBabel`.
- Remove `TS_JEST_DEBUG`; retain `TS_JEST_LOG` as the logging contract.
- Remove `stringifyContentPathRegex` if repository tests confirm it has no use beyond removed `__TRANSFORM_HTML__` compatibility.

Migration target:

```ts
transform: {
  '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
}
```

### 3. Replace Static Presets With Creator Functions

- Remove shipped static preset directories and static preset package paths.
- Remove legacy preset creators and the public `ts-jest/legacy` path only after contract tests prove it adds no supported behavior beyond the root transformer.
- Keep the six current programmatic creators: default, JS-with-TS, JS-with-Babel, and their ESM forms.
- Keep internal files under `src/legacy` temporarily; internal relocation provides little user value and would enlarge release risk.

### 4. Narrow Public Package Surface

- Add an explicit `exports` map with supported root, config helper, preset, CLI/package metadata, and any intentionally retained extension entrypoints.
- Add a package `files` allowlist so source, development output, and generated analysis files cannot be published accidentally.
- Stop root-exporting implementation details such as `ConfigSet`, compiler classes, transformer cache constants, logger internals, and broad utility barrels.
- Keep `TsJestTransformer` public only if direct construction is an intentional extension contract; otherwise expose transformer creation through the default Jest transformer API.
- Add package-boundary tests that assert allowed imports succeed and deep imports fail with documented migration guidance.

This reverses the current "every `dist/*` file is importable" behavior. Because v27's exports map was reverted for old Node support, land this only with the Node 20 floor and prerelease package-consumer testing.

### 5. Correct Configuration Semantics

- Make `tsconfig: false` actually disable tsconfig discovery.
- Make an inline `tsconfig` object standalone rather than silently overlaying a discovered file.
- Preserve automatic discovery only when `tsconfig` is omitted.
- Continue enforcing emit settings required by Jest, but document each override and emit a configuration error for incompatible user settings rather than silently changing unrelated options.
- Replace historical Node10 module-resolution defaults with TypeScript's supported modern behavior, accompanied by fixtures for CJS, ESM, Node16, NodeNext, and Bundler combinations.

### 6. Normalize Runtime Error Contracts

- Route sync and async diagnostics through the same `raiseDiagnostics` policy so `warnOnly` never throws in one mode and logs in another.
- Fail fast on invalid ESM `module`/`moduleResolution` combinations instead of logging and continuing.
- Define unsupported-extension behavior: reject files matched by ts-jest's transform unless they are explicitly supported, rather than warning and passing source through.
- Use one documented ts-jest error type for configuration and compiler diagnostics where practical.

### 7. Tighten AST Transformer Contract

- Require custom transformer modules to export valid `name`, numeric `version`, and `factory` metadata.
- Include transformer path/options and source identity in cache keys, not only manually maintained name/version.
- Explicitly document supported transformer extensions/loading mode.
- Remove `afterDeclarations` because declaration output is disabled, unless a real declaration-emission use case and test fixture are introduced before v30.

### 8. Remove Obsolete Environment Hooks

- Remove undocumented `TS_JEST_HOOKS` unless prerelease telemetry or issue research identifies active consumers; direct users to a Jest transformer chain or Babel stage.
- Remove undocumented `TS_JEST=1` process marker unless a supported external consumer is identified.

These removals need explicit release notes because undocumented behavior can still have consumers.

## Compatibility Code Removed By New Floors

With TypeScript `>=5.4`, delete branches for:

- TypeScript versions lacking `ModuleResolutionKind.Bundler`.
- TypeScript versions lacking `ModuleKind.Preserve`.
- Optional pre-4.5 compiler APIs.
- Manually maintained compiler-option unions replaced by `TsConfigJson.CompilerOptions`.

Retain TypeScript 6-specific behavior while TypeScript 5.4 remains supported. Do not require TypeScript 6 solely to remove a small conditional branch.

With Node `>=20`, remove:

- Node 12-specific warning paths.
- Node 14/16 compatibility assumptions and documentation.

With Jest 30-only support, simplify peer ranges and remove Jest 29 fixtures or compatibility branches after package-consumer tests confirm no hidden dependency.

## Migration Tooling Must Land First

Before removing any old syntax or entrypoint:

1. Repair `config:migrate` so it recognizes every shipped CJS, ESM, Babel, and legacy preset.
2. Preserve unknown/custom presets instead of converting them to default and deleting `preset`.
3. Make migration idempotent and preserve unrelated Jest globals/configuration.
4. Add transformations for globals options, static presets, legacy paths, `isolatedModules`, and renamed/removed CLI flags where automation is safe.
5. For non-automatable cases, emit actionable warnings and leave source configuration intact.
6. Add fixture-based migration tests for JavaScript, TypeScript, JSON, CJS, ESM, custom presets, comments, and repeated runs.
7. Publish a dedicated v29-to-v30 migration guide with before/after examples and a complete removed-export table.

## Changes To Defer

- Native TypeScript 7 integration: current `<7` guard reflects missing required public compiler APIs; do not couple experimental TS7 work to v30.
- ESM conversion of the ts-jest package itself: separate from transformed-code ESM support and likely to introduce unrelated loader risk.
- Full rewrite or rename of `src/legacy`: internal cleanup is not a consumer-facing goal.
- Removal of the CLI itself: first fix and measure migration usage; remove only obsolete flags in v30.
- Broad compiler architecture changes beyond unified transpilation and compatibility-branch removal.

## Branch And Merge Strategy

- Use `next` as base and target branch for every PR in this plan; do not target `main` directly.
- Current local refs show `next` 530 commits behind `main` with one nominally unique commit, `c81b667521 feat: support Jest 30`; `git cherry main next` marks it `-`, confirming its patch is already represented on `main`.
- Before implementation, fetch remote refs, confirm no open PR or release automation depends on the existing `next`, and record its old SHA for audit/recovery.
- Delete existing local and remote `next`, recreate `next` at latest `main`, and push it without carrying forward stale history. This replaces the synchronization PR.
- Verify recreated `next` and `main` resolve to the same baseline commit, then run the existing full test/build/E2E baseline.
- Create each v30 feature branch from latest `next`, open each PR as draft against `next`, and refresh it from `next` after preceding PRs merge.

## Pull Request Sequence

Each PR must be independently reviewable, include focused tests, and keep the branch releasable. Later PRs depend on earlier migration and baseline coverage.

### PR 1: Freeze v30 Compatibility Matrix

- Set Jest 30, Node 20+, and TypeScript `>=5.4 <7` policy in package metadata.
- Align CI to Node 20/22/24 and TypeScript 5.4/current 5.x/6.x.
- Add packed-package and representative CJS/ESM fixture jobs before behavior changes begin.

### PR 2: Make `config:migrate` Lossless

- Recognize every shipped CJS, ESM, Babel, and legacy preset.
- Preserve unknown/custom presets and unrelated globals.
- Make migration idempotent and add JS/TS/JSON/CJS/ESM fixture tests.
- Add warnings for cases that cannot be safely automated.

### PR 3: Remove Deprecated Configuration Placement

- Remove `globals['ts-jest']`, legacy backport keys, transformer-level `isolatedModules`, `TS_JEST_DEBUG`, and confirmed-unused `stringifyContentPathRegex` compatibility.
- Extend `config:migrate` to move each safely migratable option into the transform tuple or tsconfig.
- Update configuration types and focused transformer/config tests.

### PR 4: Remove Deprecated Type And CLI APIs

- Remove `RawCompilerOptions`, deprecated config aliases, and positional `createJestPreset`.
- Define `TsJestTransformerOptions` directly with `TsConfigJson.CompilerOptions`.
- Remove CLI `--babel` and `--allow-js`, retaining current `--js` forms.
- Add type-level API tests and CLI migration/help snapshots.

### PR 5: Replace Static And Legacy Preset Entry Points

- Remove static preset directories, deprecated legacy preset creators, and preprocessor compatibility.
- Remove public `ts-jest/legacy` only after contract tests prove root transformer parity.
- Keep six supported programmatic preset creators and add migration mappings for removed preset paths.
- Validate every retained creator in CJS and ESM package-consumer fixtures.

### PR 6: Raise Compiler Floor And Unify Transpilation

- Delete TypeScript compatibility branches made obsolete by the 5.4 floor.
- Remove native `ts.transpileModule` use in `src/legacy/compiler/ts-compiler.ts` and route isolated compilation through `src/transpilers/typescript/transpile-module.ts`.
- Replace historical Node10 resolution defaults with the selected modern contract.
- Cover CJS, ESM, Node16, NodeNext, Bundler, isolated, and language-service modes.

### PR 7: Correct tsconfig Semantics

- Distinguish omitted tsconfig, `tsconfig: false`, path config, and inline object behavior.
- Make `false` disable discovery and inline objects standalone.
- Document required emit overrides and fail clearly on incompatible settings.
- Add focused regression fixtures for each mode.

### PR 8: Normalize Diagnostics And Runtime Errors

- Route sync and async diagnostics through one `raiseDiagnostics` policy.
- Make invalid ESM combinations fail fast.
- Formalize unsupported-extension behavior and common error types.
- Add sync/async parity and `warnOnly` regression tests.

### PR 9: Tighten Custom Transformer Contract

- Require `name`, numeric `version`, and `factory` metadata.
- Include transformer path/options/source identity in cache keys.
- Define supported loading extensions and remove ineffective `afterDeclarations`.
- Remove `TS_JEST_HOOKS` and `TS_JEST=1` only after the planned consumer check.

### PR 10: Enforce Package Boundary

- Add explicit `exports` and a package `files` allowlist.
- Remove implementation-only root exports and block unsupported deep imports.
- Add package-boundary and tarball-content tests for every documented import on Node 20/22/24.
- Run representative external-project prerelease validation because v27 previously reverted an exports map.

### PR 11: Complete v30 Documentation And Release Prep

- Publish dedicated v29-to-v30 migration guide and complete removed-export replacement table.
- Update current docs, changelog, README versioning policy, CLI help, and issue-template examples.
- Verify no removed contract remains in declarations, warnings, docs, or package contents.
- Release multiple prereleases and validate representative external projects before `30.0.0`.

## Release Gates

- No deprecated symbol or option scheduled above remains in generated declarations, runtime warnings, CLI help, docs, or package contents.
- `config:migrate` never silently changes an unknown preset to another behavior.
- Sync and async processing produce equivalent diagnostics for identical input.
- `tsconfig: false`, omitted tsconfig, path tsconfig, and inline tsconfig have distinct tested semantics.
- Packed-package tests validate every documented export on Node 20, 22, and 24.
- CJS and ESM fixture matrices pass against minimum and maximum supported TypeScript versions.
- Migration guide includes a direct replacement for every removed public entrypoint, type, option, environment variable, and CLI flag.

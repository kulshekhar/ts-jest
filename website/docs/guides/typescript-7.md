---
title: Using TypeScript 7
---

TypeScript 7.0 ships a native `tsc`, but it does not ship the JavaScript compiler API that `ts-jest` needs for transforms,
language-service diagnostics, source maps, hoisting, and custom AST transformers. Microsoft provides
[`@typescript/typescript6`](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6-0)
for tools that still need that API and recommends installing it alongside TypeScript 7 with npm aliases.

## Installation

Install the two compilers under separate package names:

```bash
npm install --save-dev '@typescript/native@npm:typescript@^7.0.2' 'typescript@npm:@typescript/typescript6@^6.0.2'
```

The equivalent `package.json` configuration is:

```json
{
  "devDependencies": {
    "@typescript/native": "npm:typescript@^7.0.2",
    "typescript": "npm:@typescript/typescript6@^6.0.2"
  }
}
```

With this layout:

- `npx tsc` runs the native TypeScript 7 compiler for project type-checking and builds.
- `npx tsc6` runs the TypeScript 6 compatibility compiler when you need to compare results.
- `ts-jest` imports `typescript`, so it receives the supported TypeScript 6 JavaScript API.

Do not set the ts-jest `compiler` option to `@typescript/native`. TypeScript 7.0 has no compatible JavaScript API, and
ts-jest will stop early with an actionable configuration error if that package is loaded directly.

## Why ts-jest uses the compatibility API

Calling TypeScript 7 internals or translating between its native protocol and the TypeScript 6 API would create an unstable
second compiler integration. It would also leave gaps in custom transformers and `Program` access. The side-by-side layout is
the upstream-supported transition path and keeps one established API on the Jest transform path.

Two alternatives were deliberately rejected:

- ts-jest does not silently fall back to `@typescript/typescript6` when `typescript` resolves to TypeScript 7. ts-jest's
  public declarations import classic compiler types from `typescript`; a runtime-only fallback would make those declarations
  inconsistent with the package the user's type checker resolves.
- ts-jest does not call unstable native APIs or combine TypeScript 7 diagnostics with TypeScript 6 transforms. TypeScript 7.0
  has no stable programmatic API, and a dual-compiler path would not preserve the existing transformer and `Program` contract.

This has two practical tradeoffs:

- TypeScript 7's native performance applies to `tsc`, not to transforms performed by ts-jest. Jest transform performance is
  the same as TypeScript 6.
- TypeScript 7 should be the authoritative project type-check. Diagnostics produced during Jest transforms come from the
  TypeScript 6 compatibility API and can differ from TypeScript 7. Run `npx tsc --noEmit` separately in local development and
  CI.

TypeScript 6 reports TS5107 for `moduleResolution: Node10`. ts-jest filters that diagnostic only when it supplied Node10 as
its own historical default. If your tsconfig explicitly selects Node10, TS5107 is preserved so that you can migrate the
project configuration. Other TypeScript deprecations are not suppressed.

## Backward compatibility

Projects using TypeScript 4.3 through 6 continue to install `typescript` normally and require no configuration changes. The
`typescript` alias above exposes version 6, so it also satisfies ts-jest's existing TypeScript peer dependency. This avoids a
second runtime lookup or version-dependent transform path.

This integration should be reevaluated when TypeScript ships a stable programmatic API for the native compiler. Until then,
the aliases keep the native compiler and ts-jest's compiler API responsibilities explicit and independently upgradeable.

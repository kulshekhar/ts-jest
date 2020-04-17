---
title: Compiler Host option
---

By default `ts-jest` uses TypeScript `LanguageService` API in the context of a project (yours), with full type-checking and features.
But TypeScript `Incremental Program` can also be used to achieve the same behavior as `LanguageService`.
That's what the `compilerHost` option (which defaults to `false`) does.

The priority of using TypeScript APIs in `ts-jest` as below:
- Default TypeScript API is `LanguageService`.
- `compilerHost` is enabled: use TypeScript `Incremental Program`.
- `isolatedModules` is enabled: use TypeScript transpile modules.

Here is how to enable `ts-jest` to compile using TypeScript `Incremental Program`

### Example

<div class="row"><div class="col-md-6" markdown="block">

```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      compilerHost: true,
    }
  }
};
```

</div><div class="col-md-6" markdown="block">

```js
// OR package.json
{
  // [...]
  "jest": {
    "globals": {
      "ts-jest": {
        "compilerHost": true,
      }
    }
  }
}
```

</div></div>

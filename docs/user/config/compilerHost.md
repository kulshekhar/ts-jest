---
title: Compiler Host option
---

By default `ts-jest` uses TypeScript `LanguageService` API in the context of a project (yours), with full type-checking and features.
But TypeScript `Program` can also be used to achieve the same behavior as `LanguageService`.
That's what the `compilerHost` option (which defaults to `false`) does.

There are 2 types of TypeScript `Program`, one is `Incremental Program` which is only available from TypeScript 3.4 
and the other one is normal `Program`.

By default `ts-jest` uses `Incremental Program` if `compilerHost` is enabled. The priority of using TypeScript APIs in `ts-jest`
as below:
- Default TypeScript API is `LanguageService`.
- `compilerHost` is enabled:
    - `incremental` is enabled (**default**): use TypeScript `Incremental Program`.
    - `incremental` is disabled: use TypeScript `Program`.
- `isolatedModules` is enabled, use TypeScript transpile modules.

Here is how to enable `ts-jest` to compile using TypeScript `Program`

### Example

<div class="row"><div class="col-md-6" markdown="block">

```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      compilerHost: true,
      incremental: false,
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
        "incremental": false
      }
    }
  }
}
```

</div></div>


Here is how to enable `ts-jest` to compile using TypeScript `IncrementalProgram`

### Example

<div class="row"><div class="col-md-6" markdown="block">

```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      compilerHost: true
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
        "compilerHost": true
      }
    }
  }
}
```

</div></div>

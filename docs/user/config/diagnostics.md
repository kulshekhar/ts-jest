---
title: Diagnostics option
---

The `diagnostics` option allows to configure error reporting. 
It can both be enabled/disabled entirely or limited to a specific type of errors or files.

If a diagnostic is not filtered out, ts-jest will fail the compilation and your test.

### Disabling/enabling

By default all diagnostics are enabled. This is the same as setting the `diagnostics` option to `true`.
To disable all diagnostics, set `diagnostics` to `false`.
This might lead to slightly better performance, especially if you're not using Jest's cache.

### Advanced configuration

The option's value can also accept an object for more advanced configuration. Each config. key is optional:

- **`pretty`**: Enables/disable colorful and pretty output of errors (default: _enabled_).
- **`ignoreCodes`**: List of TypeScript error codes to ignore. Complete list can be found [there](https://github.com/Microsoft/TypeScript/blob/master/src/compiler/diagnosticMessages.json). By default here are the ones ignored:
  - `6059`: _'rootDir' is expected to contain all source files._
  - `18002`: _The 'files' list in config file is empty._ (it is strongly recommanded to include this one)
  - `18003`: _No inputs were found in config file._
- **`pathRegex`**: If specified, diagnostics of source files which path does **not** match will be ignored.

### Examples

#### Disabling diagnostics:

<div class="row"><div class="col-md-6" markdown="block">

```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      diagnostics: false
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
        "diagnostics": false
      }
    }
  }
}
```

</div></div>

#### Advanced options:

##### Enabling diagnostics for test files only

Assuming all your test files ends with `.spec.ts` or `.test.ts`, using the following config will enable error reporting only for those files:

<div class="row"><div class="col-md-6" markdown="block">

```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      diagnostics: {
        pathRegex: /\.(spec|test).ts$/
      }
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
        "diagnostics": {
          "pathRegex": "\\.(spec|test)\\.ts$"
        }
      }
    }
  }
}
```

</div></div>

##### Ignoring some error codes:

All TypeScript error codes can be found [there](https://github.com/Microsoft/TypeScript/blob/master/src/compiler/diagnosticMessages.json). The `ignoreCodes` option accepts this values:
1. A single `number` (example: `1009`): unique error code to ignore
2. A `string` with a code (example `"1009"`, `"TS1009"` or `"ts1009"`)
3. A `string` with a list of the above (example: `"1009, TS2571, 4072 ,ts6031 "`)
4. An `array` of one or more from `1` or `3` (example: `[1009, "TS2571", "6031"]`)

<div class="row"><div class="col-md-6" markdown="block">

```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      diagnostics: {
        ignoreCodes: [2571, 6031, 18003]
      }
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
        "diagnostics": {
          "ignoreCodes": [2571, 6031, 18003]
        }
      }
    }
  }
}
```

</div></div>

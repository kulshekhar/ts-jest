---
id: presets
title: Presets
---

### The 3 presets

`ts-jest` comes with 3 presets, covering most of the project's base configuration:

| Preset name | Description |
|---|---|
| `ts-jest/presets/default`<br/>or `ts-jest` | `ts-jest` will take care of `.ts` and `.tsx` files only, leaving JavaScript files as-is. |
| `ts-jest/presets/js-with-ts` | TypeScript and JavaScript files (`.ts`, `.tsx`, `.js` and `.jsx`) will be handled by `ts-jest`.<br/>You'll need to set `allowJs` to `true` in your `tsconfig.json` file. |
| `ts-jest/presets/js-with-babel` | TypeScript files will be handled by `ts-jest`, and JavaScript files will be handled by `babel-jest`. |

### Basic usage

In most cases, simply setting the `preset` key to the desired preset name in your Jest config should be enough to start using TypeScript with Jest (assuming you added `ts-jest` to your dev. dependencies of course):

```js
// jest.config.js
module.exports = {
  // [...]
  // Replace `ts-jest` with the preset you want to use
  // from the above list
  preset: 'ts-jest'
};
```

```js
// OR package.json
{
  // [...]
  "jest": {
    // Replace `ts-jest` with the preset you want to use
    // from the above list
    "preset": "ts-jest"
  }
}
```

**Note:** presets use `testMatch`, like Jest does in its defaults. If you want to use `testRegex` instead in your configuration, you MUST set `testMatch` to `null` or Jest will bail.

### Advanced

Any preset can also be used with other options.
If you're already using another preset, you might want only some specific settings from the chosen `ts-jest` preset.
In this case you'll need to use the JavaScript version of Jest config (comment/uncomment according to your use-case):

```js
// jest.config.js
const { defaults: tsjPreset } = require('ts-jest/presets');
// const { jsWithTs: tsjPreset } = require('ts-jest/presets');
// const { jsWithBabel: tsjPreset } = require('ts-jest/presets');

module.exports = {
  // [...]
  transform: {
    ...tsjPreset.transform,
    // [...]
  }
}
```

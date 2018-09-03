---
title: Compiler option
---

The `compiler` option allows you to define the compiler to be used. It'll be used to load the NodeJS module holding the TypeScript compiler.

The default value is `typescript`, which will load the original [TypeScript compiler module](https://www.npmjs.com/package/typescript). The version loaded will depend on the one installed in your project.

If you use a custom compiler, such as `ttypescript` for example, be sure its API is the same as the original TypeScript, at least for what TSJest is using.

### Example:

<div class="row"><div class="col-md-6" markdown="block">
```js
// jest.config.js
module.exports = {
  // [...]
  globals: {
    'ts-jest': {
      compiler: 'ttypsecript'
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
        "compiler": "ttypsecript"
      }
    }
  }
}
```
</div></div>

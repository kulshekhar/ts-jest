---
id: mock-es6-class
title: Mock ES6 class
---

TypeScript is transpiling your ts file and your module is likely being imported using ES2015s import.
`const soundPlayer = require('./sound-player')`. Therefore creating an instance of the class that was exported as
a default will look like this: `new soundPlayer.default()`. However if you are mocking the class as suggested by the documentation.

```js
jest.mock('./sound-player', () => {
  return jest.fn().mockImplementation(() => {
    return { playSoundFile: mockPlaySoundFile }
  })
})
```

You will get the error

```
TypeError: sound_player_1.default is not a constructor
```

because `soundPlayer.default` does not point to a function. Your mock has to return an object which has a property default
that points to a function.

```js
jest.mock('./sound-player', () => {
  return {
    default: jest.fn().mockImplementation(() => {
      return {
        playSoundFile: mockPlaySoundFile,
      }
    }),
  }
})
```

For named imports, like `import { OAuth2 } from './oauth'`, replace `default` with imported module name, `OAuth2` in this example:

```js
jest.mock('./oauth', () => {
    return {
        OAuth2: ... // mock here
    }
})
```

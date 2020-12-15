---
id: version-checking
title: Version checking
---

By default, `ts-jest` supports a range of versions for `jest`/`typescript`. One uses incompatible versions will receive a warning
message while running tests. This warning message can be opt-out by setting environment variable `TS_JEST_DISABLE_VER_CHECKER`:

**Linux/MacOS**

```
export TS_JEST_DISABLE_VER_CHECKER=true
```

**Windows**

```
set TS_JEST_DISABLE_VER_CHECKER=true
```

### Note

As long as the environment variable `TS_JEST_DISABLE_VER_CHECKER` stays, the warning message will no longer show.
This can lead to unexpected errors due to the usage of incompatible versions' dependencies. Use this environment variable with precautions.

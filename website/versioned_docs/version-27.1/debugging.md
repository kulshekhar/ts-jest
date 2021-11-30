---
id: debugging
title: Debugging ts-jest
---

You can activate the debug logger by setting the environment variable `TS_JEST_LOG` before running tests.
The output of the logger will be in **ts-jest.log** in current working directory.

The debug logger contains some useful information about how internal `ts-jest` works, including which files are processed,
which Jest config or TypeScript config is used etc.

**Linux/MacOS**

```
export TS_JEST_LOG=ts-jest.log
```

**Windows**

```
set TS_JEST_LOG=ts-jest.log
```

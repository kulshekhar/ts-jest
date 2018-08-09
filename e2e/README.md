# E2E tests


## Directory structure

- `__cases__`: each scenario/minimal repo is in a sub-folder of this one
- `__templates__`: contains the package dependency templates for test cases
- `__templates__/default`: is the default template
- `__tests__`: contains the actual tests
- `__workdir_synlink__`: is created during a test run and is a symbolic link to a subfolder in the temp folder of the OS where all test cases are installed


## Test helpers

To run a test case (one of `__cases__`) in your e2e tests, you must use the `configureTestCase(...)` helper imported from `e2e/__helpers__/test-case.ts`:

```ts
const testCase = configureTestCase(
    name: string,
    options?: {
        template?: string
        env?: {}
        args?: string[]
    }
)
```

- `name`, **required**: The name of the test case (directory of your case within `e2e/__cases__/`)
- `template`, _optional_: The name of the template to be used (directory of the template within `e2e/__template__/`)
- `env`, _optional_: Extra environment variables to set when running (ie.: `{MY_VAR: '1'}`)
- `args`, _optional_: Extra arguments to give to jest when running  (ie.: `['--coverage']`)

The returned value is an object with those properties and methods:

- `testCase.name`: name of the case
- `testCase.templateName`: name of the template (it will resolve it if not given in `configureTestCase()`)
- `testCase.workdir`: full path to the directory where the tests will be run for that test case (it won't exists until the `run()` method has been called)
- `testCase.run()`: will prepare the test case workdir folder and run `jest` in it, returning an object with these properties:
    - `status`, _number_: the status code it exited with
    - `stdout`, _string_: the data written to stdout during the run
    - `stderr`, _string_: the data written to stderr during the run
    - `output`, _string_: the data written to stdout and stderr during the run

    **Note 1**: _The value returned by `run()` is snapshot friendly (ie.: you can `expect(x.run()).toMatchSnapshot()`, it'll remove any changin values such as time values)_

    **Note 2**: _You can optionally pass the expected status code as the first argument of `run()`. In the case it's not the correct one, it'll write in the console the actual `output` so that you can debug the test case._

Bare simple example of using it in your tests:
```ts
const testCase = configureTestCase('some-case');
expect(testCase.run().status).toBe(0);
```

You can find more information on how to create and use templates [there](./__templates__/README.md).


## Running

You run the E2E tests with `yarn test:e2e` (or `npm run test:e2e`). What will happen in order is as follow (directories are related to `[ts-jest]/e2e` path):

1. A bundle (we'll call it `[bundle]`) will be created for `ts-jest` using `npm pack` (`yarn pack` is buggy).
   
    The `prepublish` script will be run, so `clean` and `build` (that is why e2e tests are launched before the others, since it's building as part of the process)

2. a sub-folder is created in the main temp dir of the OS, let's refer to it as `[e2e-temp]`
3. a template directory `[e2e-temp]/__templates__/[xxx]` is created for each `__templates__/[xxx]` by copying files
4. `npm ci` and `npm install --save-dev [bundle]` will be run in each `[e2e-temp]/__templates__/[xxx]` directory

    We use `npm ci` as it's the fastest install way, but it requires a `package-lock.json`, that is why we need another step to install our bundle from step **1**.
    Doing so in template directories will allow us to link the node modules in real test cases, instead of running `npm install` for each of them.

5.  each test suite under `__tests__/**/*.spec.ts` are run.

Then within tests, when the `configureTestCase(...).run()` is called (see [how to use `configureTestCase`](./__templates__/README.md#using-a-specific-template)), this is what happen:

1. the test case folder is recusivly copied from `__cases__/[case-name]` to `[e2e-temp]/[template-name]/[case-name]`
2. a `node_modules` symbolic link is created, targeting its appropriate template's `node_modules` path (`[e2e-temp]/__templatses__/[template-name]/node_modules`)

    Using templates allow us to install only once the node modules for each template, a template being a kind of "package-set".
    If the template name is not given in `configureTestCase()`, the one in `e2eTemplate` field of `__cases__/[case-name]/package.json` is used. If this field is not set, the `default` template is used.


## Why

E2E tests being in a temporary folder of the operating system ensure none of the parents would be containing `node_modules`.

For a concrete example, requiring `@babel/core` in a test case under `[ts-jest]/tests/some-test-case-folder/` would look for `@babel/core` in `[ts-jest]/tests/some-test-case-folder/node_modules/` of course, and if not found will fallback to `[ts-jest]/node_modules`.

Having the test cases outside of `[ts-jest]` project's root ensures it won't fallback the resolution of node modules within dev dependencies of `ts-jest` itself.

Not to mention that using `npm pack` ensure those tests cases have the same version of `ts-jest` as the one we would publish on NPM.

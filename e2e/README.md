# E2E tests


## Directory structure

- `__cases__`: each scenario/minimal repo is in a sub-folder of this one
- `__templates__`: contains the package dependency templates for test cases
- `__templates__/default`: is the default template
- `__tests__`: contains the actual tests
- `__e2e_workdir_link__`: is created during a test run and is a symbolic link to a subfolder in the temp folder of the OS where all test cases are installed


## Running

You run the E2E tests with `yarn test:e2e` (or `npm run test:e2e`). What will happen in order is as follow (directories are related to `[ts-jest]/e2e` path):

1. A bundle (we'll call it `[bundle]`) will be created for `ts-jest` using `npm pack` (`yarn pack` is buggy).
   
    The `prepublish` script will be run, so `clean` and `build` (that is why e2e tests are launched before the others, since it's building as part of the process)

2. a sub-folder is created in the main temp dir of the OS, let's refer to it as `[e2e-temp]`
3. a template directory `[e2e-temp]/__templates__/[xxx]` is created for each `__templates__/[xxx]` by copying files
4. `npm ci` and `npm install --save-dev [bundle]` will be run in each `[e2e-temp]/__templates__/[xxx]` directory

    We use `npm ci` as it's the fastest install way, but it requires a `package-lock.json`, that is why we need another step to install our bundle from step **1**.
    Doing so in template directories will allow us to link the node modules in real test cases, instead of running `npm install` for each of them.

3.  each test suite under `__tests__/**/*.spec.ts` are run.

Then within tests, when an expectation is done using the `testCase()` helper amd `.toRunWithExitCode(...)` (see [how to use testCase()](./__templates__/README.md#using-a-specific-template)), this is what happen:

1. the test case folder is recusivly copied from `__cases__/[case-name]` to `[e2e-temp]/[template-name]/[case-name]`
2. a `node_modules` symbolic link is created, targeting its appropriate template's `node_modules` path (`[e2e-temp]/__templatses__/[template-name]/node_modules`)

    Using templates allow us to install only once the node modules for each template, a template being a kind of "package-set".
    If the template name is not given in `testCase()`, the one in `e2eTemplate` field of `__cases__/[case-name]/package.json` is used. If this field is not in there, the `default` template is used.


## Why

E2E tests being in a temporary folder of the operating system ensure none of the parents would be containing `node_modules`.

For a concrete example, requiring `@babel/core` in a test case under `[ts-jest]/tests/some-test-case-folder/` would look for `@babel/core` in `[ts-jest]/tests/some-test-case-folder/node_modules/` of course, and if not found will fallback to `[ts-jest]/node_modules`.

Having the test cases outside of `[ts-jest]` project's root ensures it won't fallback the resolution of node modules within dev dependencies of `ts-jest` itself.

Not to mention that using `npm pack` ensure those tests cases have the same version of `ts-jest` as the one we would publish on NPM.


## More info

You can find more information on how to create and use templates [there](./__templates__/README.md).
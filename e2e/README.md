# E2E tests


## Directory structure

- `__cases__`: each scenario/minimal repo is in a sub-folder of this one
- `__cases__/package-template.json`: is used as the `package.json` for the test cases template
- `__tests__`: contains the actual tests
- `__e2e_workdir_link__`: is created during a test run and is a symbolic link to a subfolder in the temp folder of the OS where all test cases are installed


## Running

You run the E2E tests with `yarn test:e2e` (or `npm run test:e2e`). What will happen in order is as follow (directories are related to `[ts-jest]/e2e` path):

1. A bundle will be created for `ts-jest` using `npm pack` (`yarn pack` is buggy).
   
   The `prepublish` script will be run, so `clean` and `build` (that is why e2e tests are launched before the others, since it's building as part of the process)

2. a subfolder is created in the main temp dir of the OS, let's call refer to it as `[e2e-temp]`
3. a template directory `[e2e-temp]/__template__` is created
4. `__cases__/package-template.json` is copied into `[e2e-temp]/__template__`
5. the bundle create in step **1**, as well as packages `jest` and `typescript` are `npm install`-ed

    Doing so in a template will allow us to link the node modules in real test cases, instead of running `npm install` for each of them

6. each test case folder is recusivly copied from `__cases__/[case-name]` to `[e2e-temp]/[case-name]`
7. a `node_modules` directory is created in each copied test case folder, and each module dir found in the template (`[e2e-temp]/__template__/node_modules/*`) is sym-linked in `[e2e-temp]/[case-name]/node_modules/`

    We could have linked directly the `node_modules` directory, but doing like we did allow us to install aditional packages per test case, without altering the template folder.

8. each test suite under `__tests__/**/*.spec.ts` are run.


## Why

E2E tests being in a temporary folder of the operating system ensure none of the parents would be containing `node_modules`.

For a concrete example, requiring `@babel/core` in a test case under `[ts-jest]/tests/some-test-case-folder/` would look for `@babel/core` in `[ts-jest]/tests/some-test-case-folder/node_modules/` of course, and if not found will fallback to `[ts-jest]/node_modules`.

Having the test cases outside of `[ts-jest]` project's root ensures it won't fallback the resolution of node modules within dev dependencies of `ts-jest` itself.

Not to mention that using `npm pack` ensure those tests cases have the same version of `ts-jest` as the one we would publish on NPM.

# E2E package-set templates

Each directory must contain a `package.json` and `package-lock.json`.

To use it as a template in your test case, add `"e2eTemplate": "my-template-dir"` in the `package.json` of your test case.

Normally you should not worry and only use the default template (which is what happen if you do not set any `e2eTemplate` key). But in some test case you might want to have a specific package installed. Then you first look for a directory containing a `package.json` with dependencies you want, and if there isn't, you create one by duplicating the `default` (more explanation below).

## Creating a template

Let's say you want to create a template with the `lodash` package and call the template `with-lodash` (surprising name, I know):

1. `cd e2e/__templates__`
2. `mkdir with-lodash`
3. `cp default/*.json with-lodash/`
4. `cd with-lodash`
5. edit `package.json` to give it another `name`
6. `npm install && npm install --save lodash` (or `--save-dev`, but **use npm and NOT yarn**)
7. `rm -rf node_modules` this is not mandatory but it'll make the test run faster, `npm ci` is faster than copying over tons of files

That's it, the template is ready to be used


## Using a specific template

Let's say you want to use your lately created `with-lodash` template with a `my-case` test case:

1. the test case should be run only with this template:

    - in `e2e/__cases__/my-case/.ts-jest-e2e.json` set the `template` key to `"with-lodash"`
    - in `e2e/__tests__/my-case.spec.ts`:

    ```ts
    import configureTestCase from '../__helpers__/test-case';

    describe('Some test', () => {
      it('should pass', () => {
        const testCase = configureTestCase('my-case');
        expect(testCase.run().status).toBe(0);
      })
    })
    ```

2. the test case is already been used with another template or you want to force it in the test:

    - update the test `e2e/__tests__/my-case.spec.ts` (or create a new one):

    ```ts
    import configureTestCase from '../__helpers__/test-case';

    describe('Some test', () => {
      // original test  
      it('should pass', () => {
        const testCase = configureTestCase('my-case');
        expect(testCase.run().status).toBe(0);
      })

      // added test, using our new template
      it('should pass with loadash', () => {
        const testCase = configureTestCase('my-case', { template: 'with-lodash'});
        expect(testCase.run().status).toBe(0);
      })
    })
    ```

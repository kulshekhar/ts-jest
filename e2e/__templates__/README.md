# E2E package-set tempaltes

Each directory must contain a `package.json` and `package-lock.json`.

To use it as a tempalte in your test case, add `"e2eTemplate": "my-template-dir"` in the `package.json` of your test case.

Normally you should not worry and only use the default template (which is what happen if you do not set any `e2eTemplate` key). But in some test case you might want to have a specific package installed. Then you first look for a directory containing a `package.json` with dependencies you want, and if there isn't, you create one by duplicating the `default` (more explanation below).

## Creating a template

Let's say you want to create a template with the `lodash` package and call the tempalte `with-lodash` (surprising name, I know):

1. `cd e2e/__templates__`
2. `mkdir with-lodash`
3. `cp default/*.json with-lodash/`
4. `cd with-lodash`
5. `npm install && npm install --save lodash`
6. `rm -rf node_modules` this is not mandatory but it'll make the test run faster, `npm ci` is faster than copying over tons of files

That's it, the template is ready to be used


## Using a specific tempalte

Let's say you want to use your lately created `with-lodash` template in a `using-lodash` test case:

1. `cd e2e/__cases__/using-lodash`
2. edit `package.json` and set/update the `e2eTempalte` to `"with-lodash"`

That's it!

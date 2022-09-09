---
id: contributing
title: Contributing
---

When contributing to this repository, please first discuss the change you wish to make via [`ts-jest` GitHub discussion](https://github.com/kulshekhar/ts-jest/discussions) or [issue](https://github.com/kulshekhar/ts-jest/issues) with the owners of this repository before making a change.

Please note we have a code of conduct, please follow it in all your interactions with the project.

## Pull Request Process

1. Ensure the tests are passing and that you have latest `main` branch merged in.
2. Update the `docs/` with details of your changes if required.
3. If possible, squash your commits. There must be only one commit in your PR (until a review). Then after each review requesting changes, DO NOT squash your commits with the one before the review, so that we can see intermediate modifications.
4. You may merge the Pull Request in once you have the sign-off of two other developers, or if you do not have permission to do that, you may request the second reviewer to merge it for you.

_These are internal technical documents. If you're not a contributor to `ts-jest`, but simply trying to use the library you'll find nothing of value here_

## E2E Testing

### Preparing

The preparation of E2E test directory is done in `scripts/e2e.js`. Here is the process:

```plantuml
start

:bundle ts-jest;
note right
will build ts-jest before creating the bundle
end note

:create temp work dir;
note right
`e2e/~__workdir_symlink__` links to it
except on CI environments
end note

while (for each template)
note right
templates are in `e2e/~__templates__/`
end note

if (template's build directory) then (exists)
:wipe but `node_modules` dir;
else (not exists)
:create;
endif

:copy files from template's dir to its build dir;

if (package lock file) then (exists)
:read metadata;

    if (package lock file) then (has changed)
      :remove `node_modules` dir;

      :npm install (or ci);

      :npm install ts-jest bundle;

    else if (ts-jest bundle) then (has changed)
      :npm install ts-jest bundle;

    else (hasn't changed)
    endif
    :write updated metadata;

else (not exists)
endif

endwhile (done)

:all templates ready;

stop
```

### Running

When a test-case needs to be run with a given template within tests, here is what's happening (in `e2e/__helpers__/test-case/runtime.ts`):

```plantuml
start

:create work dir;
note right
It'll be different per test-case
and per template basis.
end note
-> e2e/~__workdir_symlink__/{template}/{test-case};

if (has a node_modules dir?) then (yes)
:symlink node_modules;
note left
avoid re-running npm install
for each test case and template;
end note
else (no)
endif

:copy files from template;
note right
all files in template dir are
copied to test case work dir
except `node_modules` and
`package-lock.json`
end note

while (for each file in test case dir)
if (is snapshot dir) then (yes)
:symlink dir;
note left
snapshots directories are symlinked
to test case source dir so that
updating them would update in the
source folder
end note

else if (is jest.config.js) then (yes)
if (jest.config.js is function?) then (yes)
:call with parent content;
note left
allows for
extending
end note
else (no)
endif

else (others)
:copy;
note right
all files in test case source
dir are copied to the work dir
except `node_modules` and
`package-lock.json`
end note

endif
endwhile

:create special files;
note right
some special files are created
to handle hooks for example and
grab `process()` IO for later
expectations
end note

:update package.json;
note right
set a custom but fixed name
and version in package.json
which is specific to the
test case + template
end note

#tomato:run tests;

while (for each snapshot) is (missing in test case)
:copy;
note right
while we symlinked each snapshots
directory, newly created snapshots
in non existing dir will need to
be copied over into
e2e/~__cases__/{test-case}
end note
endwhile

:return results;

stop
```

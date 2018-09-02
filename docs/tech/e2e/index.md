---
title: E2E tests flow
---
## Preparing

The preparation of E2E test directory is done in `scripts/e2e.js`. Here is the process:

{% plantuml %}

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
    tempaltes are in `e2e/~__templates__/`
  end note

  if (template's build directory) then (esists)
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

{% endplantuml %}


## Running

When a test-case needs to be run with a given template within tests, here is what's happening (in `e2e/__helpers__/test-case/runtime.ts`):

{% plantuml %}

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
  `package-lock.josn`
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
      `package-lock.josn`
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

{% endplantuml %}

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Collaborator Guidelines](#collaborator-guidelines)
  - [Installing and building the project](#installing-and-building-the-project)
  - [Merging PRs](#merging-prs)
  - [Versioning](#versioning)
  - [Tests](#tests)
    - [How to add tests](#how-to-add-tests)
    - [How to run tests](#how-to-run-tests)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Collaborator Guidelines

ts-jest is grateful for all issues, PRs and contributions. In this file are tips for getting started contributing,
and best practices, so that we can ensure that we can maintain this project in the future.

## Installing and building the project

To be able to install and build the project probably, `rimraf` is required. Install `rimraf` by running
```
yarn global add rimraf
```

After installing `rimraf`, `yarn` command can be run normally when installing dependencies for the project

## Merging PRs

1. A PR should be merged when at least one of the following conditions is satisfied:

- 2 collaborators have reviewed and okayed the PR
- 1 collaborator has reviewed and okayed the PR and 36 hours have passed after the PR was submitted

2. Collaborators should squash and merge PRs with a commit message explaining the changes.

3. All PRs should add the author's name and email address to the authors file, if it isn't already present.

## Versioning

ts-jest must match the major version of jest. Matching the minor version is preferred. Matching the version patch is not required.

When merging PRs which fix bugs, it is preferable to increment the version patch version so that the changes can be published to NPM.

## Tests

All new features or bugfixes should be accompanied with a new test, to ensure that the change works as intended, and to make sure we don't inadvertently break it in the future through refactring

If you are simply refactoring code, it is not needed to add a test.

### How to add tests
- Tests are added by creating a new file in tests/__tests__ 
- A test usually consists of two parts
	 - A directory under tests/ that have some files that should result in a specific output when jest is passed through it
	 - A file under tests/__tests__ that uses the runJest command to run Jest on the specified directory, and makes asserts on the output of stdout and stderr
	 	When asserting things on the output, it is common to both assert something about the exit code, and something about the output. Always assert on the output first, before asserting on the status code - as it leads to much nicer error messages when refactoring. (You get the full output text, rather than just '0 didn't equal 1')

### How to run tests
Tests are run through `yarn test`

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Collaborator Guidelines](#collaborator-guidelines)
  - [Merging PRs](#merging-prs)
  - [Versioning](#versioning)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Collaborator Guidelines

## Merging PRs

1. A PR should be merged when at least one of the following conditions is satisfied:

- 2 collaborators have reviewed and okayed the PR
- 1 collaborator has reviewed and okayed the PR and 36 hours have passed after the PR was submitted

2. Collaborators should squash and merge PRs with a commit message explaining the changes.

3. All PRs should add the author's name and email address to the authors file, if it isn't already present.

## Versioning

ts-jest must match the major version of jest. Matching the minor version is preferred. Matching the version patch is not required.

When merging PRs which fix bugs, it is preferable to increment the version patch version so that the changes can be published to NPM.

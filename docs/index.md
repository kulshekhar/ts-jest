---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: home
---
# ts-jest [![npm version](https://badge.fury.io/js/ts-jest.svg)](https://badge.fury.io/js/ts-jest) [![NPM downloads](https://img.shields.io/npm/dm/ts-jest.svg?style=flat)](https://npmjs.org/package/ts-jest) [![Known Vulnerabilities](https://snyk.io/test/github/kulshekhar/ts-jest/badge.svg)](https://snyk.io/test/github/kulshekhar/ts-jest) [![Build Status for linux](https://travis-ci.org/kulshekhar/ts-jest.svg?branch=master)](https://travis-ci.org/kulshekhar/ts-jest) [![Build Status for Windows](https://ci.appveyor.com/api/projects/status/g8tt9qd7usv0tolb/branch/master?svg=true)](https://ci.appveyor.com/project/kulshekhar/ts-jest/branch/master)

<img src="assets/img/logo.png" align="right"
     title="TSJest Logo by Huafu Gandon" width="128" height="128">

**TSJest** (`ts-jest`) is a TypeScript preprocessor with source map support for Jest that lets you use Jest to test projects written in TypeScript.

It supports all features of TypeScript _(even those which Babel 7 typescript plugin does not)_ and has an internal cache for your tests to run faster.

---

<img src="assets/img/slack.png" align="left" height="24">
[Ask for some help in the ts-jest community of Slack](https://join.slack.com/t/ts-jest/shared_invite/enQtNDE1ODQ0OTEzMTczLWU2ZTk5YTMzYTE1YjBkZTk5ODI1NWU3NWU0NzhlOWJlZDNkYTRlM2Y3NWQ1YWVjMjc5Mjg1NmY1NTdkNWQ3MTA)

<img src="assets/img/troubleshooting.png" align="left" height="24">
[Before reporting any issue, be sure to check the troubleshooting page](user/troubleshooting)

<img src="assets/img/pull-request.png" align="left" height="24">
[Looking for collaborators. Want to help improve ts-jest?](https://github.com/kulshekhar/ts-jest/issues/223)

---

## Getting Started

These instructions will get you setup to use TSJest in your project.

| | using npm | using yarn |
|---:|---|---|
| **Prerequisites** | `npm i -D jest typescript` | `yarn add --dev jest typescript` |
| **Installing** | `npm i -D ts-jest` | `yarn add --dev ts-jest` |
| **Creating config** | `node_modules/.bin/ts-jest config:init` | `yarn ts-jest config:init` |
| **Running tests** | `npm t` or `node_modules/.bin/jest` | `yarn test` or `yarn jest` |

## Configuration

See the documentation about how to configure TSJest [there](user/config).

## Built With

* [TypeScript](https://www.typescriptlang.org/) - JavaScript that scales
* [Jest](https://jestjs.io/) - Delightful JavaScript Testing
* [TSJest](https:/github.com/kulshekhar/ts-jest) - Jest processor for TypeScript _(yes, TSJest uses itself for its tests)_

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We **DOT NOT** use [SemVer](http://semver.org/) for versioning. Tho you can think about SemVer when reading our version, except our major number follow the one of Jest. For the versions available, see the [tags on this repository](https://github.com/kulshekhar/ts-jest/tags).

## Authors/maintainers

* **Kulshekhar Kabra** - [kulshekar](https://github.com/kulshekhar)
* **Gustav Wengel** - [GeeWee](https://github.com/GeeWee)
* **Ahn** - [ahnpnl](https://github.com/ahnpnl)
* **Huafu Gandon** - [huafu](https://github.com/huafu)

See also the list of [contributors](https://github.com/kulshekhar/ts-jest/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](https:/github.com/kulshekhar/ts-jest/LICENSE.md) file for details

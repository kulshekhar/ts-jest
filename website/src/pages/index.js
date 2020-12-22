import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import React from 'react'

function IntroHeading({ ...siteConfig }) {
  return (
    <div className="content-section" align="center">
      <p>
        <img src="img/logo.png" title="ts-jest Log" width="128" height="128" />
      </p>
      <h1>ts-jest</h1>
      <p>{siteConfig.tagline}</p>
      <p>
        <a href="https://www.npmjs.com/package/ts-jest">
          <img src="https://img.shields.io/npm/v/ts-jest/latest.svg?style=flat-square" alt="NPM version" />{' '}
        </a>
        <a href="https://www.npmjs.com/package/ts-jest">
          <img src="https://img.shields.io/npm/v/ts-jest/next.svg?style=flat-square" alt="NPM version" />{' '}
        </a>
        <a href="https://www.npmjs.com/package/ts-jest">
          <img src="https://img.shields.io/npm/dm/ts-jest.svg?style=flat-square" alt="NPM downloads" />{' '}
        </a>
        <a href="https://snyk.io/test/github/kulshekhar/ts-jest">
          <img
            src="https://snyk.io/test/github/kulshekhar/ts-jest/badge.svg?style=flat-square"
            alt="Known vulnerabilities"
          />{' '}
        </a>
        <a href="https://coveralls.io/github/kulshekhar/ts-jest?branch=master">
          <img
            src="https://coveralls.io/repos/github/kulshekhar/ts-jest/badge.svg?branch=master"
            alt="Coverage status"
          />{' '}
        </a>
        <a href="https://actions-badge.atrox.dev/kulshekhar/ts-jest/goto?ref=master">
          <img
            alt="GitHub actions"
            src="https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Fkulshekhar%2Fts-jest%2Fbadge%3Fref%3Dmaster&style=flat-square"
          />{' '}
        </a>
        <a href="https://github.com/kulshekhar/ts-jest/blob/master/LICENSE">
          <img src="https://img.shields.io/npm/l/ts-jest.svg?style=flat-square" alt="GitHub license" />{' '}
        </a>
      </p>
      <p>
        It supports all features of TypeScript including type-checking.{' '}
        <a href="docs/babel7-or-ts" className="link">
          Read more about Babel 7 <code>preset-typescript</code> <strong>vs</strong> TypeScript(and <code>ts-jest</code>
          )
        </a>
      </p>
    </div>
  )
}

function IntroDescription() {
  return (
    <div className="content-section">
      <p>
        <a href="https://www.reactiflux.com" className="link">
          <img src="img/discord.svg" align="left" height="24" className="link-icon" />
          Ask for some help in the <code>Jest</code> Discord community
        </a>{' '}
        or{' '}
        <a href="https://github.com/kulshekhar/ts-jest/discussions" className="link">
          <code>ts-jest</code> GitHub Discussions
        </a>
      </p>
      <p>
        <a href="https://github.com/kulshekhar/ts-jest/blob/master/TROUBLESHOOTING.md" className="link">
          <img src="img/troubleshooting.png" align="left" height="24" className="link-icon" />
          Before reporting any issue, be sure to check the troubleshooting page
        </a>
      </p>
      <p>
        <a href="https://github.com/kulshekhar/ts-jest/issues/223" className="link">
          <img src="img/pull-request.png" align="left" height="24" className="link-icon" />
          Looking for collaborators. Want to help improve <code>ts-jest</code> ?
        </a>
      </p>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function Home() {
  const context = useDocusaurusContext()
  const { siteConfig = {} } = context

  return (
    <Layout title={siteConfig.title} description="ts-jest official documentation site">
      <header>
        <IntroHeading {...siteConfig} />
        <IntroDescription />
      </header>
      <main>
        <section className="content-section">
          <h2>Usage</h2>
          <p>
            Refer to the{' '}
            <a href="docs/installation" className="link">
              {' '}
              installation{' '}
            </a>
            and{' '}
            <a href="docs/presets" className="link">
              {' '}
              configuration{' '}
            </a>{' '}
            instructions.
          </p>
        </section>
        <section className="content-section">
          <h2>Built With</h2>
          <ul>
            <li>
              <a href="https://www.typescriptlang.org" className="link">
                TypeScript
              </a>{' '}
              - JavaScript that scales
            </li>
            <li>
              <a href="https://jestjs.io/" className="link">
                Jest
              </a>{' '}
              - Delightful JavaScript Testing
            </li>
            <li>
              <a href="https://github.com/kulshekhar/ts-jest" className="link">
                ts-jest
              </a>{' '}
              - Jest processor for TypeScript{' '}
              <i>
                (yes, <code>ts-jest</code> uses itself for its tests)
              </i>
            </li>
          </ul>
        </section>
        <section className="content-section">
          <h2>Contributing</h2>
          <p>
            Please read{' '}
            <a href="https://github.com/kulshekhar/ts-jest/blob/master/CONTRIBUTING.md" className="link">
              contributing
            </a>{' '}
            for details on our code of conduct, and the process for submitting pull requests to us.
          </p>
        </section>
        <section className="content-section">
          <h2>Versioning</h2>
          <p>
            We <strong>DO NOT</strong> use{' '}
            <a href="http://semver.org/" className="link">
              SemVer
            </a>
            . Our Major version follows Jest, which means that our <strong>minor changes can be breaking.</strong>{' '}
            Please make sure to pin your version of <code>ts-jest</code> to a specific version if this is a problem. For
            the versions available, see the{' '}
            <a href="https://github.com/kulshekhar/ts-jest/tags" className="link">
              tags on this repository.
            </a>
          </p>
        </section>
        <section className="content-section">
          <h2>Authors/Maintainers</h2>
          <ul>
            <li>
              <span>
                <strong>Kulshekhar Kabra</strong>
              </span>{' '}
              -{' '}
              <a className="link" href="https://github.com/kulshekhar">
                kulshekhar
              </a>
            </li>
            <li>
              <span>
                <strong>Gustav Wengel</strong>
              </span>{' '}
              -{' '}
              <a className="link" href="https://github.com/GeeWee">
                GeeWee
              </a>
            </li>
            <li>
              <span>
                <strong>Ahn</strong>
              </span>{' '}
              -{' '}
              <a className="link" href="https://github.com/ahnpnl">
                ahnpnl
              </a>
            </li>
            <li>
              <span>
                <strong>Huafu Gandon</strong>
              </span>{' '}
              -{' '}
              <a className="link" href="https://github.com/huafu">
                huafu
              </a>
            </li>
          </ul>
          <p>
            See also the list of{' '}
            <a className="link" href="https://github.com/kulshekhar/ts-jest/contributors">
              contributors
            </a>{' '}
            who participated in this project.
          </p>
        </section>
        <section className="content-section">
          <h2>Supporters</h2>
          <ul>
            <li>
              <p>
                <a className="link" href="https://www.jetbrains.com/?from=ts-jest">
                  JetBrains
                </a>{' '}
                has been kind enough to support ts-jest with an{' '}
                <a className="link" href="https://www.jetbrains.com/community/opensource/?from=ts-jest">
                  open source license
                </a>
                .
              </p>
            </li>
          </ul>
        </section>
        <section>
          <h2>License</h2>
          <p>
            This project is licensed under the MIT License - see the{' '}
            <a className="link" href="https://github.com/kulshekhar/ts-jest/blob/master/LICENSE.md">
              {' '}
              LICENSE.md
            </a>{' '}
            file for details
          </p>
        </section>
      </main>
    </Layout>
  )
}

export default Home

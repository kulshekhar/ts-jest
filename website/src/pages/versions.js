// eslint-disable-next-line no-unused-vars
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import { useVersions, useLatestVersion } from '@theme/hooks/useDocs'
// eslint-disable-next-line no-unused-vars
import Layout from '@theme/Layout'
// eslint-disable-next-line no-unused-vars
import React from 'react'

function Version() {
  const { siteConfig } = useDocusaurusContext()
  const versions = useVersions()
  const latestVersion = useLatestVersion()
  const pastVersions = versions.filter((version) => version !== latestVersion && version.name !== 'current')
  const nextVersion = versions[0]
  const repoUrl = `https://github.com/${siteConfig.organizationName}/${siteConfig.projectName}`

  return (
    <Layout title="Versions" description="ts-jest Versions page listing all documented site versions">
      <main className="container margin-vert--lg">
        <h1>ts-jest documentation versions</h1>

        {
          <div className="margin-bottom--lg">
            <h3 id="next">Next version (Unreleased)</h3>
            <p>Here you can find the documentation for work-in-process unreleased version.</p>
            <table>
              <tbody>
                <tr>
                  <th>{nextVersion.label}</th>
                  <td>
                    <Link to={nextVersion.path}>Documentation</Link>
                  </td>
                  <td>
                    <a href={`${repoUrl}/blob/main/CHANGELOG.md`}>Release Notes</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        }

        <div className="margin-bottom--lg">
          <h3 id="latest">Latest version (Stable)</h3>
          <p>Here you can find the documentation for current released version.</p>
          <table>
            <tbody>
              <tr>
                <th>{latestVersion.label}</th>
                <td>
                  <Link to={latestVersion.path}>Documentation</Link>
                </td>
                <td>
                  <a href={`${repoUrl}/blob/main/CHANGELOG.md`}>Release Notes</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {pastVersions.length > 0 && (
          <div className="margin-bottom--lg">
            <h3 id="archive">Past versions (Not maintained anymore)</h3>
            <p>Here you can find documentation for previous versions of Docusaurus.</p>
            <table>
              <tbody>
                {pastVersions.map((version) => (
                  <tr key={version.name}>
                    <th>{version.label}</th>
                    <td>
                      <Link to={version.path}>Documentation</Link>
                    </td>
                    <td>
                      <a href={`${repoUrl}/blob/main/CHANGELOG.md`}>Release Notes</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </Layout>
  )
}

export default Version

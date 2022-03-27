import Link from '@docusaurus/Link'
import { translate } from '@docusaurus/Translate'
import useBaseUrl from '@docusaurus/useBaseUrl'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import clsx from 'clsx'
import React from 'react'

import styles from './styles.module.css'

const features = [
  {
    title: 'Easy to Use',
    description: <>Several Jest presets to let you start quickly with testing.</>,
  },
  {
    title: 'Full TypeScript features',
    description: <>Support all available TypeScript features including type checking.</>,
  },
  {
    title: 'Babel support',
    description: <>Support working in combination with Babel</>,
  },
]

// eslint-disable-next-line no-unused-vars
function Feature({ imageUrl, title, description }) {
  const imgUrl = useBaseUrl(imageUrl)

  return (
    <div className={clsx('col', styles.section)}>
      {imgUrl && (
        <div className="text--center">
          <img className={styles.featureImage} src={imgUrl} alt={title} />
        </div>
      )}
      <h3 className={clsx(styles.featureHeading)}>{title}</h3>
      <p className="padding-horiz--md">{description}</p>
    </div>
  )
}

function Home() {
  const context = useDocusaurusContext()
  const { siteConfig: { tagline } = {} } = context

  return (
    <Layout title={tagline} description={tagline}>
      <header>
        <div className={styles.hero}>
          <div className={styles.heroInner}>
            <h1 className={styles.heroProjectTagline}>
              <img
                alt={translate({ message: 'Docusaurus with Keytar' })}
                className={styles.heroLogo}
                src={useBaseUrl('/img/logo.svg')}
              />
              <span className={styles.heroTitleTextHtml}>
                Delightful testing with <b>Jest</b> and <b>TypeScript</b>
              </span>
            </h1>
            <div className={styles.indexCtas}>
              <Link className={clsx('button button--primary button--lg')} to={useBaseUrl('docs/')}>
                Get Started
              </Link>
              <span className={styles.indexCtasGitHubButtonWrapper}>
                <iframe
                  className={styles.indexCtasGitHubButton}
                  src="https://ghbtns.com/github-btn.html?user=kulshekhar&amp;repo=ts-jest&amp;type=star&amp;count=true&amp;size=large"
                  width={160}
                  height={30}
                  title="GitHub Stars"
                />
              </span>
            </div>
          </div>
        </div>
        <div className={clsx(styles.announcement, styles.announcementDark)}>
          <div className={styles.announcementInner}>
            Coming from v23.10? Check out our <Link to="/docs/migration">v23.10 to latest version migration guide</Link>
            .
          </div>
        </div>
      </header>
      <main>
        {features && features.length > 0 && (
          <section className={styles.section}>
            <div className="container text--center">
              <div className="row">
                {features.map((props, idx) => (
                  <Feature imageUrl={''} key={idx} {...props} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </Layout>
  )
}

export default Home

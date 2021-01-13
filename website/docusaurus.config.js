const simplePlantUML = require('@akebifiky/remark-simple-plantuml')

module.exports = {
  title: 'ts-jest',
  tagline:
    'A TypeScript preprocessor with source map support for Jest that lets you use Jest to test projects written in TypeScript.',
  url: 'https://kulshekhar.github.io',
  baseUrl: '/ts-jest/',
  favicon: 'img/logo.svg',
  organizationName: 'kulshekhar',
  projectName: 'ts-jest',
  themeConfig: {
    navbar: {
      title: 'Home',
      logo: {
        alt: 'ts-jest',
        src: 'img/logo.png',
      },
      items: [
        {
          to: 'docs/installation',
          activeBasePath: 'docs',
          label: 'Docs',
          position: 'left',
        },
        {
          href: 'https://github.com/kulshekhar/ts-jest/',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: 'docs/installation',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Slack',
              href: 'https://bit.ly/3bRHFPQ',
            },
          ],
        },
        {
          title: 'Social',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/kulshekhar/ts-jest/',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} ts-jest. Built with Docusaurus.`,
    },
    prism: {
      theme: require('prism-react-renderer/themes/nightOwlLight'),
    },
    sidebarCollapsible: false,
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/kulshekhar/ts-jest/edit/master/docs',
          remarkPlugins: [simplePlantUML],
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
}

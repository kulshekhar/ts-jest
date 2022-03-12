module.exports = {
  docs: [
    {
      type: 'category',
      label: 'ts-jest',
      items: ['introduction', 'processing', 'contributing'],
    },
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/installation',
        'getting-started/presets',
        'getting-started/options',
        'getting-started/paths-mapping',
        'getting-started/version-checking',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      items: [
        'guides/esm-support',
        'guides/mock-es6-class',
        'guides/react-native',
        'guides/troubleshooting',
        'guides/using-with-monorepo',
      ],
    },
    {
      type: 'doc',
      id: 'babel7-or-ts',
    },
    {
      type: 'doc',
      id: 'migration',
    },
    {
      type: 'doc',
      id: 'debugging',
    },
  ],
}

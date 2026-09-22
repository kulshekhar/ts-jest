module.exports = (api) => {
  api.assertVersion('^8.0.0')
  api.cache(true)

  return {
    plugins: [
      () => ({
        visitor: {
          StringLiteral(path) {
            if (path.node.value === '__BABEL_8__') {
              path.node.value = 'Babel 8'
            }
          },
        },
      }),
    ],
  }
}

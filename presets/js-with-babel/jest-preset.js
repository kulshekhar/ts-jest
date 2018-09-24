const create = require('../create')

module.exports = create({ allowJs: false }, {
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
})

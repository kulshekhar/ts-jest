require('path')

const uncoveredFunction = () => (true ? 1 + '5' : '999')

module.exports = {
  uncoveredFunction,
}

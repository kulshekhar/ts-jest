const version = 1
const name = 'dummy-transformer'
function factory() {
  return () => {
    return (sf) => {
      return sf
    }
  }
}

module.exports = {
  factory,
  version,
  name,
}

import bufferFrom = require('buffer-from')

import { sha1 } from './sha1'

const ONE = 'fe05bcdcdc4928012781a5f1a2a77cbb5398e106'
const ONE_TWO = '30ae97492ce1da88d0e7117ace0a60a6f9e1e0bc'
const ONE_TWO_THREE = '3e949019500deb1369f13d9644d420d3a920aa5e'

it('should encrypt one or more string', () => {
  expect(sha1('one')).toBe(ONE)
  expect(sha1('one', 'two')).toBe(ONE_TWO)
  expect(sha1('one', 'two', 'three')).toBe(ONE_TWO_THREE)
})

it('should encrypt one or more buffers', () => {
  expect(sha1(bufferFrom('one'))).toBe(ONE)
  expect(sha1(bufferFrom('one'), bufferFrom('two'))).toBe(ONE_TWO)
  expect(sha1(bufferFrom('one'), bufferFrom('two'), bufferFrom('three'))).toBe(ONE_TWO_THREE)
})

it('should encrypt mixed items', () => {
  expect(sha1('one', bufferFrom('two'), 'three')).toBe(ONE_TWO_THREE)
  expect(sha1(bufferFrom('one'), 'two', bufferFrom('three'))).toBe(ONE_TWO_THREE)
})

import a from '../__test_modules__/a'
import b from '../__test_modules__/b'

// These will all be hoisted above imports
jest.disableAutomock()
jest.mock('../__test_modules__/b')

describe('hoisting', () => {
  test('hoists disableAutomock call before imports', () => {
    expect(a._isMockFunction).toBe(undefined)
  })

  test('hoists mock call before imports', () => {
    expect(b._isMockFunction).toBe(true)
  })
})

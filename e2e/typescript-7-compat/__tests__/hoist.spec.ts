import { dependency } from '../src/dependency'

jest.mock('../src/dependency', () => ({ dependency: 'mocked' }))

it('hoists Jest mocks before imports', () => {
  expect(dependency).toBe('mocked')
})

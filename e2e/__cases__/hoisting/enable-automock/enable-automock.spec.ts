jest.enableAutomock()

import hello from './enable-automock'

test('original implementation', () => {
  // now we have the mocked implementation,
  // @ts-expect-error
  expect(hello._isMockFunction).toBeTruthy()
})

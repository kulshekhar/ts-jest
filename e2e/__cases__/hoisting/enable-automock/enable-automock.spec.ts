jest.enableAutomock()

import hello from './enable-automock'

test('original implementation', () => {
  // now we have the mocked implementation,
  // @ts-ignore
  expect(hello._isMockFunction).toBeTruthy()
})

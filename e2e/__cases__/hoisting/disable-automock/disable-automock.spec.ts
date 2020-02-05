import hello from './disable-automock'

jest.disableAutomock()

test('original implementation', () => {
  // now we have the original implementation,
  // even if we set the automocking in a jest configuration
  expect(hello()).toBe('hi!')
})

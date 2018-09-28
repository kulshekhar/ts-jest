import { configureTestCase } from '../__helpers__/test-case'

test('test-helpers', () => {
  const test = configureTestCase('test-helpers', { noCache: true })
  expect(test.run(1)).toMatchSnapshot()
})

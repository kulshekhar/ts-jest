import { configureTestCase } from '../__helpers__/test-case'

test('test-helpers', () => {
  const test = configureTestCase('test-helpers', { noCache: true })
  expect(test.run(1)).toMatchSnapshot()
})

test('with esModuleInterop set to false', () => {
  const test = configureTestCase('test-helpers', {
    noCache: true,
    tsJestConfig: { tsConfig: { esModuleInterop: false, allowSyntheticDefaultImports: false } },
  })
  expect(test.run(1)).toMatchSnapshot()
})

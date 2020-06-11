import { PackageSets } from '../__helpers__/templates'
import { configureTestCase } from '../__helpers__/test-case'

// 'ts-jest' is tested in almost all test cases
// 'ts-jest/presets/default' is an alias of the above
// 'ts-jest/presets/js-with-ts' is tested in allow-js.test.ts

describe('ts-jest/presets/js-with-babel', () => {
  const testCase = configureTestCase('preset-with-babel', { jestConfig: { preset: 'ts-jest/presets/js-with-babel' } })

  testCase.runWithTemplates([PackageSets.default], 1, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest()
      expect(result.status).toBe(1)
      expect(result.stderr).toMatch(/(Couldn't|Cannot) find (preset|module) ["']@babel\/preset-env["']/)
    })
  })

  testCase.runWithTemplates([PackageSets.babel7, PackageSets.babel7StringConfig], 0, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest()
      expect(result.status).toBe(0)
      expect(result).toMatchSnapshot()
    })
  })
})

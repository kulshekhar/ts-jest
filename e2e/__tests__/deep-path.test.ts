import { readFileSync } from 'fs'
import { join } from 'path'

import { allValidPackageSets } from '../__helpers__/templates'
import { configureTestCase } from '../__helpers__/test-case'

describe('Deep paths test', () => {
  const testCase = configureTestCase('deep')

  testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest()
      expect(result.status).toBe(0)
      expect(result).toMatchSnapshot('output')
      let content: string = readFileSync(join(result.cwd, 'src', 'Tests', 'coverage', 'lcov.info'), 'utf8')
      content = result.normalize(content)
      expect(content).toMatchSnapshot('lcov')
    })
  })
})

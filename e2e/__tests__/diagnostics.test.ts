import { writeFileSync } from 'fs'
import { join } from 'path'

import { allValidPackageSets } from '../__helpers__/templates'
import { configureTestCase } from '../__helpers__/test-case'

describe('With diagnostics throw, should reevaluate with cached content', () => {
  const testCase = configureTestCase('diagnostics')

  describe('first throw', () => {
    testCase.runWithTemplates(allValidPackageSets, 1, (runTest, { testLabel }) => {
      it(testLabel, () => {
        const result = runTest()
        expect(result.status).toBe(1)
        expect(result).toMatchSnapshot()
      })
    })
  })

  describe('then passed when valid content has changed', () => {
    beforeAll(() => {
      writeFileSync(join(__dirname, '../__cases__/diagnostics/main.ts'), `export type Thing = {
  a: number;
  // b: number;
}`)
    })

    afterAll(() => {
      writeFileSync(join(__dirname, '../__cases__/diagnostics/main.ts'), `export type Thing = { a: number, b: number }`)
    })

    testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { testLabel }) => {
      it(testLabel, () => {
        const result = runTest()
        expect(result.status).toBe(0)
        expect(result).toMatchSnapshot()
      })
    })
  })
})

describe('With diagnostics, warn only', () => {
  const testCase = configureTestCase('diagnostics', {
    tsJestConfig: { diagnostics: { warnOnly: true } },
    noCache: true,
  })

  testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest()
      expect(result.status).toBe(0)
      expect(result).toMatchSnapshot()
    })
  })
})

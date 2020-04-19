import { writeFileSync } from 'fs'
import { join } from 'path'

import { allValidPackageSets } from '../__helpers__/templates'
import { configureTestCase } from '../__helpers__/test-case'

describe('With diagnostics throw', () => {
  const testCase = configureTestCase('diagnostics/throw')

  describe('first throw', () => {
    testCase.runWithTemplates(allValidPackageSets, 1, (runTest, { testLabel }) => {
      it(testLabel, () => {
        const result = runTest()
        expect(result.status).toBe(1)
        expect(result).toMatchSnapshot()
      })
    })
  })

  describe('then pass when type has changed to valid base on cache of the previous run', () => {
    beforeAll(() => {
      writeFileSync(join(__dirname, '../__cases__/diagnostics/throw/main.ts'), `export const foo = 42\nexport type Thing = { a: number }`)
    })

    afterAll(() => {
      writeFileSync(join(__dirname, '../__cases__/diagnostics/throw/main.ts'), `export const foo = 42\nexport type Thing = { a: number, b: number }\n`)
    })

    testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { testLabel }) => {
      it(testLabel, () => {
        const result = runTest()
        expect(result.status).toBe(0)
        expect(result).toMatchSnapshot()
      })
    })
  })

  describe('then fail when code has changed to invalid base on cache of the previous run', () => {
    beforeAll(() => {
      writeFileSync(join(__dirname, '../__cases__/diagnostics/throw/main.ts'), `export const foo = 43\nexport type Thing = { a: number }`)
    })

    afterAll(() => {
      writeFileSync(join(__dirname, '../__cases__/diagnostics/throw/main.ts'), `export const foo = 42\nexport type Thing = { a: number, b: number }\n`)
    })

    testCase.runWithTemplates(allValidPackageSets, 1, (runTest, { testLabel }) => {
      it(testLabel, () => {
        const result = runTest()
        expect(result.status).toBe(1)
        expect(result).toMatchSnapshot()
      })
    })
  })
})

describe('With diagnostics warn only', () => {
  const testCase = configureTestCase('diagnostics/warn', {
    tsJestConfig: {
      diagnostics: { warnOnly: true },
    },
    noCache: true, // warnings shown only on first compilation
  })

  testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest()
      expect(result.status).toBe(0)
      expect(result).toMatchSnapshot()
    })
  })
})

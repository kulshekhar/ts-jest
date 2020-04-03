import { writeFileSync } from 'fs'
import { join } from 'path'

import { allPackageSetsWithProgram, allPackageSetsWithoutProgram, allValidPackageSets } from '../__helpers__/templates'
import { configureTestCase } from '../__helpers__/test-case'

describe('With diagnostics throw', () => {
  describe('using language service', () => {
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

    describe('then passed when content has changed to valid base on cache of the previous run', () => {
      beforeAll(() => {
        writeFileSync(join(__dirname, '../__cases__/diagnostics/main.ts'), `export type Thing = {
  a: number;
  // b: number;
}`)
      })

      afterAll(() => {
        writeFileSync(join(__dirname, '../__cases__/diagnostics/main.ts'), `export type Thing = { a: number, b: number }\n`)
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

  describe('using program', () => {
    const testCase = configureTestCase('diagnostics', {
      tsJestConfig: {
        compilerHost: true,
        incremental: false,
      },
    })

    describe('first throw', () => {
      testCase.runWithTemplates(allPackageSetsWithProgram, 1, (runTest, { testLabel }) => {
        it(testLabel, () => {
          const result = runTest()
          expect(result.status).toBe(1)
          expect(result).toMatchSnapshot()
        })
      })
    })

    describe('then passed when content has changed to valid base on cache of the previous run', () => {
      beforeAll(() => {
        writeFileSync(join(__dirname, '../__cases__/diagnostics/main.ts'), `export type Thing = {
  a: number;
  // b: number;
}`)
      })

      afterAll(() => {
        writeFileSync(join(__dirname, '../__cases__/diagnostics/main.ts'), `export type Thing = { a: number, b: number }\n`)
      })

      testCase.runWithTemplates(allPackageSetsWithProgram, 0, (runTest, { testLabel }) => {
        it(testLabel, () => {
          const result = runTest()
          expect(result.status).toBe(0)
          expect(result).toMatchSnapshot()
        })
      })
    })

    describe('with unsupported version', () => {
      testCase.runWithTemplates(allPackageSetsWithoutProgram, 1, (runTest, { testLabel }) => {
        it(testLabel, () => {
          const result = runTest()
          expect(result.status).toBe(1)
          expect(result).toMatchSnapshot()
        })
      })
    })
  })

  describe('using incremental program', () => {
    const testCase = configureTestCase('diagnostics', {
      tsJestConfig: {
        compilerHost: true,
        incremental: true,
      },
    })

    describe('first throw', () => {
      testCase.runWithTemplates(allPackageSetsWithProgram, 1, (runTest, { testLabel }) => {
        it(testLabel, () => {
          const result = runTest()
          expect(result.status).toBe(1)
          expect(result).toMatchSnapshot()
        })
      })
    })

    describe('then passed when content has changed to valid base on cache of the previous run', () => {
      beforeAll(() => {
        writeFileSync(join(__dirname, '../__cases__/diagnostics/main.ts'), `export type Thing = {
  a: number;
  // b: number;
}`)
      })

      afterAll(() => {
        writeFileSync(join(__dirname, '../__cases__/diagnostics/main.ts'), `export type Thing = { a: number, b: number }\n`)
      })

      testCase.runWithTemplates(allPackageSetsWithProgram, 0, (runTest, { testLabel }) => {
        it(testLabel, () => {
          const result = runTest()
          expect(result.status).toBe(0)
          expect(result).toMatchSnapshot()
        })
      })
    })

    describe('with unsupported version', () => {
      testCase.runWithTemplates(allPackageSetsWithoutProgram, 1, (runTest, { testLabel }) => {
        it(testLabel, () => {
          const result = runTest()
          expect(result.status).toBe(1)
          expect(result).toMatchSnapshot()
        })
      })
    })
  })
})

describe('With diagnostics warn only', () => {
  const testCase = configureTestCase('diagnostics', {
    tsJestConfig: {
      diagnostics: { warnOnly: true },
      noCache: true, // warnings shown only on first compilation
    },
  })

  testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest()
      expect(result.status).toBe(0)
      expect(result).toMatchSnapshot()
    })
  })
})

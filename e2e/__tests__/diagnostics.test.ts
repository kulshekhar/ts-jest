import { writeFileSync } from 'fs'
import { join } from 'path'

import { allPackageSetsWithProgram, allPackageSetsWithoutProgram, allValidPackageSets } from '../__helpers__/templates'
import { configureTestCase } from '../__helpers__/test-case'

describe('Diagnostics using language service', () => {
  describe('with throw', () => {
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

  describe('with warn only', () => {
    const testCase = configureTestCase('diagnostics', {
      tsJestConfig: { diagnostics: { warnOnly: true } },
    })

    describe('first passed without warning', () => {
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

    describe('then show warning when content changed to invalid base on cached of the previous run', () => {
      testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { testLabel }) => {
        it(testLabel, () => {
          const result = runTest()
          expect(result.status).toBe(0)
          expect(result).toMatchSnapshot()
        })
      })
    })
  })
})

describe('Diagnostics using program', () => {
  describe('with throw', () => {
    const testCase = configureTestCase('diagnostics', {
      tsJestConfig: { compilerHost: true, incremental: false },
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
        writeFileSync(join(__dirname, '../__cases__/diagnostics/main.ts'), `export type Thing = { a: number, b: number }`)
      })

      testCase.runWithTemplates(allPackageSetsWithProgram, 0, (runTest, { testLabel }) => {
        it(testLabel, () => {
          const result = runTest()
          expect(result.status).toBe(0)
          expect(result).toMatchSnapshot()
        })
      })
    })
  })

  describe('with warn only', () => {
    const testCase = configureTestCase('diagnostics', {
      tsJestConfig: { compilerHost: true, incremental: false, diagnostics: { warnOnly: true } },
    })

    describe('first passed without warning', () => {
      beforeAll(() => {
        writeFileSync(join(__dirname, '../__cases__/diagnostics/main.ts'), `export type Thing = {
  a: number;
  // b: number;
}`)
      })

      afterAll(() => {
        writeFileSync(join(__dirname, '../__cases__/diagnostics/main.ts'), `export type Thing = { a: number, b: number }`)
      })

      testCase.runWithTemplates(allPackageSetsWithProgram, 0, (runTest, { testLabel }) => {
        it(testLabel, () => {
          const result = runTest()
          expect(result.status).toBe(0)
          expect(result).toMatchSnapshot()
        })
      })
    })

    describe('then show warning when content changed to invalid base on cached of the previous run', () => {
      testCase.runWithTemplates(allPackageSetsWithProgram, 0, (runTest, { testLabel }) => {
        it(testLabel, () => {
          const result = runTest()
          expect(result.status).toBe(0)
          expect(result).toMatchSnapshot()
        })
      })
    })
  })

  describe('with typescript version not supported program', () => {
    const testCase = configureTestCase('diagnostics', {
      tsJestConfig: { compilerHost: true, incremental: false, diagnostics: { warnOnly: true } },
    })

    testCase.runWithTemplates(allPackageSetsWithoutProgram, 1, (runTest, { testLabel }) => {
      it(testLabel, () => {
        const result = runTest()
        expect(result.status).toBe(1)
        expect(result).toMatchSnapshot()
      })
    })
  })
})

describe('Diagnostics using incremental program', () => {
  describe('with throw', () => {
    const testCase = configureTestCase('diagnostics', {
      tsJestConfig: { compilerHost: true, incremental: true },
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
        writeFileSync(join(__dirname, '../__cases__/diagnostics/main.ts'), `export type Thing = { a: number, b: number }`)
      })

      testCase.runWithTemplates(allPackageSetsWithProgram, 0, (runTest, { testLabel }) => {
        it(testLabel, () => {
          const result = runTest()
          expect(result.status).toBe(0)
          expect(result).toMatchSnapshot()
        })
      })
    })
  })

  describe('with warn only', () => {
    const testCase = configureTestCase('diagnostics', {
      tsJestConfig: { compilerHost: true, incremental: true, diagnostics: { warnOnly: true } },
    })

    describe('first passed without warning', () => {
      beforeAll(() => {
        writeFileSync(join(__dirname, '../__cases__/diagnostics/main.ts'), `export type Thing = {
  a: number;
  // b: number;
}`)
      })

      afterAll(() => {
        writeFileSync(join(__dirname, '../__cases__/diagnostics/main.ts'), `export type Thing = { a: number, b: number }`)
      })

      testCase.runWithTemplates(allPackageSetsWithProgram, 0, (runTest, { testLabel }) => {
        it(testLabel, () => {
          const result = runTest()
          expect(result.status).toBe(0)
          expect(result).toMatchSnapshot()
        })
      })
    })

    describe('then show warning when content changed to invalid base on cached of the previous run', () => {
      testCase.runWithTemplates(allPackageSetsWithProgram, 0, (runTest, { testLabel }) => {
        it(testLabel, () => {
          const result = runTest()
          expect(result.status).toBe(0)
          expect(result).toMatchSnapshot()
        })
      })
    })
  })

  describe('with typescript version not supported incremental program', () => {
    const testCase = configureTestCase('diagnostics', {
      tsJestConfig: { compilerHost: true, incremental: true, diagnostics: { warnOnly: true } },
      noCache: true,
    })

    testCase.runWithTemplates(allPackageSetsWithoutProgram, 1, (runTest, { testLabel }) => {
      it(testLabel, () => {
        const result = runTest()
        expect(result.status).toBe(1)
        expect(result).toMatchSnapshot()
      })
    })
  })
})

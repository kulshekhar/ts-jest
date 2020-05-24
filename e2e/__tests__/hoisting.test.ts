import { allValidPackageSets } from '../__helpers__/templates'
import { configureTestCase } from '../__helpers__/test-case'

describe('Hoisting', () => {
  describe('jest.mock() & jest.unmock()', () => {
    const testCase = configureTestCase('hoisting/mock-unmock', {
      writeIo: true,
    })

    testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { testLabel }) => {
      it(testLabel, () => {
        const result = runTest()
        expect(result.status).toBe(0)
        expect(result).toMatchSnapshot('output-mockUnmock')
        expect(result.ioFor('mock-unmock.spec.ts')).toMatchSnapshot('io-mockUnmock')
      })
    })
  })

  describe('jest.enableAutomock()', () => {
    const testCase = configureTestCase('hoisting/enable-automock', { writeIo: true })

    testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { testLabel }) => {
      it(testLabel, () => {
        const result = runTest()
        expect(result.status).toBe(0)
        expect(result).toMatchSnapshot('output-enableAutomock')
        expect(result.ioFor('enable-automock.spec.ts')).toMatchSnapshot('io-enableAutomock')
      })
    })
  })

  describe('jest.disableAutomock()', () => {
    const testCase = configureTestCase('hoisting/disable-automock', {
      writeIo: true,
      jestConfig: {
        automock: true,
      }
    })

    testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { testLabel }) => {
      it(testLabel, () => {
        const result = runTest()
        expect(result.status).toBe(0)
        expect(result).toMatchSnapshot('output-disableAutomock')
        expect(result.ioFor('disable-automock.spec.ts')).toMatchSnapshot('io-disableAutomock')
      })
    })
  })
})

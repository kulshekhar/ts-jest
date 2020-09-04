import { configureTestCase } from '../__helpers__/test-case'
import { allValidPackageSets } from '../__helpers__/templates'

function executeTest(rootDirs?: string[]) {
  const testCase = configureTestCase('path-mapping', {
    tsJestConfig: {
      tsConfig: {
        rootDirs,
        baseUrl: '.',
        paths: {
          '@share/*': ['share/*']
        }
      },
      astTransformers: {
        before: [
          'ts-jest/dist/transformers/path-mapping'
        ],
      },
    },
    writeIo: true,
  })

  testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest()
      expect(result.status).toBe(0)
      expect(result).toMatchSnapshot(rootDirs ? 'with rootDirs' : 'without rootDirs')
    })
  })
}

describe('Path mapping', () => {
  describe('without rootDirs', () => {
    executeTest()
  })

  describe('with rootDirs', () => {
    executeTest(['./'])
  })
})

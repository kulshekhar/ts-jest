import runJest, { json as runWithJson } from '../run-jest'
import { extractSortedSummary } from '../utils'

const DIR_NAME = 'const-enum'

test(`successfully runs the tests inside ${DIR_NAME} with 'isolatedModules: false'`, () => {
  const { json } = runWithJson(DIR_NAME)

  expect(json.success).toBe(true)
})

test(`partial successfully runs the tests inside ${DIR_NAME} with 'isolatedModules: true'`, () => {
  const result = runJest(DIR_NAME, ['-c=jest-isolated.config.js'])

  expect(extractSortedSummary(result.stderr).rest).toMatchInlineSnapshot(`
    "FAIL __tests__/import-from-d-ts-no-js.spec.ts
      ● Test suite failed to run

        Cannot find module '../hoo-constant' from '__tests__/import-from-d-ts-no-js.spec.ts'

        However, Jest was able to find:
        	'../hoo-constant.d.ts'

        You might want to include a file extension in your import, or update your 'moduleFileExtensions', which is currently ['js', 'jsx', 'ts', 'tsx', 'json', 'node'].

        See https://jestjs.io/docs/configuration#modulefileextensions-arraystring

        > 1 | import { HooConstEnum } from '../hoo-constant'
            | ^
          2 |
          3 | const getTwo = (): string => HooConstEnum.two
          4 |

          at Resolver.resolveModule (../../node_modules/jest-resolve/build/resolver.js:322:11)
          at Object.<anonymous> (__tests__/import-from-d-ts-no-js.spec.ts:1:1)

    PASS __tests__/import-from-d-ts-has-js.spec.ts
    PASS __tests__/import-from-ts.spec.ts"
  `)
})

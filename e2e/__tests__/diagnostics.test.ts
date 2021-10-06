import runJest, { json as runWithJson } from '../run-jest'
import { extractSortedSummary } from '../utils'

const DIR = 'diagnostics'

test('throw errors when running the tests inside `diagnostics/` with `isolatedModules: false`', () => {
  const result = runJest(DIR, undefined, {
    stripAnsi: true,
  })

  expect(extractSortedSummary(result.stderr).rest).toMatchInlineSnapshot(`
    "FAIL __tests__/diagnostics.spec.ts
      ● Test suite failed to run

        __tests__/diagnostics.spec.ts:3:7 - error TS2741: Property 'b' is missing in type '{ a: number; }' but required in type 'Thing'.

        3 const thing: Thing = { a: 1 }
                ~~~~~

          foo.ts:1:34
            1 export type Thing = { a: number; b: number }
                                               ~
            'b' is declared here."
  `)
})

test('successfully runs the tests inside `diagnostics/` with `isolatedModules: true`', () => {
  const { json } = runWithJson(DIR, ['-c=jest-isolated.config.js'])

  expect(json.success).toBe(true)
})

test('successfully runs the tests inside `diagnostics/` with diagnostics option `warnOnly: true`', () => {
  const { json } = runWithJson(DIR, ['-c=jest-warn.config.js'])

  expect(json.success).toBe(true)
})

test('successfully runs the tests inside `diagnostics/` with `diagnostics: false`', () => {
  const { json } = runWithJson(DIR, ['-c=jest-disabled.config.js'])

  expect(json.success).toBe(true)
})

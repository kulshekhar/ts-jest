import { stripVTControlCharacters } from 'node:util'

import { runJest } from '../run-jest'

interface JestJsonResult {
  numFailedTests: number
  testResults: Array<{ message: string }>
}

describe('source-map', () => {
  it.each([
    'jest-compiler-cjs.config.ts',
    'jest-compiler-esm.config.ts',
    'jest-transpiler-cjs.config.ts',
    'jest-transpiler-esm.config.ts',
  ])('should map a failed TypeScript test with %s', async (configFile) => {
    const result = await runJest('source-map', configFile, ['--json', '--no-colors'])
    const output = JSON.parse(result.stdout) as JestJsonResult
    const message = stripVTControlCharacters(output.testResults[0].message).replaceAll('\\', '/')

    expect(result.exitCode).toBe(1)
    expect(output.numFailedTests).toBe(1)
    expect(message).toContain('__tests__/source-map.test.ts:10:25')
    expect(message).toContain('> 10 |   expect(result.actual).toBe(expected)')
    expect(message).toContain('|                         ^')
  })
})

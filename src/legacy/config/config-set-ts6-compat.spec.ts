import * as ts from 'typescript'

import { createConfigSet } from '../../__helpers__/fakers'

jest.mock('typescript', () => {
  const actualModule = jest.requireActual('typescript') as typeof ts

  return {
    __esModule: true,
    ...actualModule,
    version: '6.0.3',
  }
})

describe('ConfigSet with a TypeScript 6.x compiler module', () => {
  it('should force ignoreDeprecations so 7.0 migration deprecations (e.g. TS5107 for the injected node10 default) never fail in-memory compilation', () => {
    const configSet = createConfigSet({ tsJestConfig: { tsconfig: { module: 'commonjs' } } })

    expect(configSet.parsedTsConfig.options.ignoreDeprecations).toBe('6.0')
  })
})

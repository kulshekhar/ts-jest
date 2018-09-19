import { logTargetMock } from '../__helpers__/mocks'

import { pathsToModuleNameMapper } from './paths-to-module-name-mapper'

const tsconfigMap = {
  log: ['src/util/log'],
  server: ['src/server'],
  'util/*': ['src/util/*'],
  'api/*': ['src/api/*'],
  'test/*': ['test/*'],
  'mocks/*': ['test/mocks/*'],
  'test/*/mock': ['test/mocks/*'],
}

describe('pathsToModuleNameMapper', () => {
  it('should convert tsconfig mapping', () => {
    expect(pathsToModuleNameMapper(tsconfigMap)).toMatchInlineSnapshot(`
Object {
  "^api/(.*)$": "src/api/$1",
  "^log$": "src/util/log",
  "^mocks/(.*)$": "test/mocks/$1",
  "^server$": "src/server",
  "^test/(.*)$": "test/$1",
  "^test/(.*)/mock$": "test/mocks/$1",
  "^util/(.*)$": "src/util/$1",
}
`)
  })

  it('should use the given prefix', () => {
    expect(pathsToModuleNameMapper(tsconfigMap, { prefix: '<rootDir>/' })).toMatchInlineSnapshot(`
Object {
  "^api/(.*)$": "<rootDir>/src/api/$1",
  "^log$": "<rootDir>/src/util/log",
  "^mocks/(.*)$": "<rootDir>/test/mocks/$1",
  "^server$": "<rootDir>/src/server",
  "^test/(.*)$": "<rootDir>/test/$1",
  "^test/(.*)/mock$": "<rootDir>/test/mocks/$1",
  "^util/(.*)$": "<rootDir>/src/util/$1",
}
`)
  })

  it('should warn about mapping it cannot handle', () => {
    const log = logTargetMock()
    log.clear()
    expect(
      pathsToModuleNameMapper({
        kept: ['src/kept'],
        'no-target': [],
        'too-many-target': ['one', 'two'],
        'too/*/many/*/stars': ['to/*/many/*/stars'],
      }),
    ).toMatchInlineSnapshot(`
Object {
  "^kept$": "src/kept",
  "^too\\\\-many\\\\-target$": "one",
}
`)
    expect(log.lines.warn).toMatchInlineSnapshot(`
Array [
  "[level:40] Not mapping \\"no-target\\" because it has no target.
",
  "[level:40] Mapping only to first target of \\"too-many-target\\" because it has more than one (2).
",
  "[level:40] Not mapping \\"too/*/many/*/stars\\" because it has more than one star (\`*\`).
",
]
`)
  })
})

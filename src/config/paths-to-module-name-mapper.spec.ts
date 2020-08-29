import { logTargetMock } from '../__helpers__/mocks'

import { pathsToModuleNameMapper } from './paths-to-module-name-mapper'

const tsconfigMap = {
  log: ['src/utils/log'],
  server: ['src/server'],
  client: ['src/client', 'src/client/index'],
  'util/*': ['src/utils/*'],
  'api/*': ['src/api/*'],
  'test/*': ['test/*'],
  'mocks/*': ['test/mocks/*'],
  'test/*/mock': ['test/mocks/*', 'test/__mocks__/*'],
}

describe('pathsToModuleNameMapper', () => {
  it('should convert tsconfig mapping', () => {
    expect(pathsToModuleNameMapper(tsconfigMap)).toMatchInlineSnapshot(`
      Object {
        "^api/(.*)$": "src/api/$1",
        "^client$": Array [
          "src/client",
          "src/client/index",
        ],
        "^log$": "src/utils/log",
        "^mocks/(.*)$": "test/mocks/$1",
        "^server$": "src/server",
        "^test/(.*)$": "test/$1",
        "^test/(.*)/mock$": Array [
          "test/mocks/$1",
          "test/__mocks__/$1",
        ],
        "^util/(.*)$": "src/utils/$1",
      }
    `)
  })

  it('should use the given prefix', () => {
    expect(pathsToModuleNameMapper(tsconfigMap, { prefix: '<rootDir>/' })).toMatchInlineSnapshot(`
      Object {
        "^api/(.*)$": "<rootDir>/src/api/$1",
        "^client$": Array [
          "<rootDir>/src/client",
          "<rootDir>/src/client/index",
        ],
        "^log$": "<rootDir>/src/utils/log",
        "^mocks/(.*)$": "<rootDir>/test/mocks/$1",
        "^server$": "<rootDir>/src/server",
        "^test/(.*)$": "<rootDir>/test/$1",
        "^test/(.*)/mock$": Array [
          "<rootDir>/test/mocks/$1",
          "<rootDir>/test/__mocks__/$1",
        ],
        "^util/(.*)$": "<rootDir>/src/utils/$1",
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
        'too/*/many/*/stars': ['to/*/many/*/stars'],
      }),
    ).toMatchInlineSnapshot(`
      Object {
        "^kept$": "src/kept",
      }
    `)
    expect(log.lines.warn).toMatchInlineSnapshot(`
      Array [
        "[level:40] Not mapping \\"no-target\\" because it has no target.
      ",
        "[level:40] Not mapping \\"too/*/many/*/stars\\" because it has more than one star (\`*\`).
      ",
      ]
    `)
  })
})

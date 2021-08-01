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
  '@foo-bar/common': ['../common/dist/library'],
  '@pkg/*': ['./packages/*'],
}

describe('pathsToModuleNameMapper', () => {
  test('should convert tsconfig mapping with no given prefix', () => {
    expect(pathsToModuleNameMapper(tsconfigMap)).toMatchInlineSnapshot(`
Object {
  "^@foo\\\\-bar/common$": "../common/dist/library",
  "^@pkg/(.*)$": "./packages/$1",
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

  test.each(['<rootDir>/', 'foo'])('should convert tsconfig mapping with given prefix', (prefix) => {
    expect(pathsToModuleNameMapper(tsconfigMap, { prefix })).toMatchSnapshot(prefix)
  })

  test('should warn about mapping it cannot handle', () => {
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

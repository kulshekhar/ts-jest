import * as path from 'path'
import { tsConfigToModuleNameMapper } from './tsconfig-to-module-name-mapper'

describe('tsConfigToModuleNameMapper', () => {
  it('creates module name map for both paths and project references', () => {
    const tsConfigDir = path.join(__dirname, '__helpers__', 'project')
    const mapper = tsConfigToModuleNameMapper(tsConfigDir)

    expect(mapper).toMatchInlineSnapshot(`
      Object {
        "@ts-jest/project-1": "${__dirname}/__helpers__/project-1",
        "@ts-jest/project-2": "${__dirname}/__helpers__/project-2/src/index",
        "@ts-jest/project-3": "${__dirname}/__helpers__/project-3/index",
        "@ts-jest/project-4": "${__dirname}/__helpers__/project-4/someDir/index",
        "^api/(.*)$": "src/api/$1",
        "^client$": Array [
          "src/client",
          "src/client/index",
        ],
        "^log$": "src/util/log",
        "^mocks/(.*)$": "test/mocks/$1",
        "^server$": "src/server",
        "^test/(.*)$": "test/$1",
        "^test/(.*)/mock$": Array [
          "test/mocks/$1",
          "test/__mocks__/$1",
        ],
        "^util/(.*)$": "src/util/$1",
      }
    `)
  })
})

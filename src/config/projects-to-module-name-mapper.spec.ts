import * as path from 'path'
import { projectsToModuleNameMapper } from './projects-to-module-name-mapper'

const tsConfigReferences = [
  {
    path: './__helpers__/project-1',
  },
  {
    path: '__helpers__/project-2',
  },
  {
    path: '__helpers__/project-3',
  },
  {
    path: '__helpers__/project-4',
  },
]

describe('projectsToModuleNameMapper', () => {
  it('creates module name map for each project refrence', () => {
    const mapper = projectsToModuleNameMapper(__dirname, tsConfigReferences)

    expect(mapper).toMatchInlineSnapshot(`
      Object {
        "@ts-jest/project-1": "${path.join(__dirname, `/__helpers__/project-1`)}",
        "@ts-jest/project-2": "${path.join(__dirname, `/__helpers__/project-2/src/index`)}",
        "@ts-jest/project-3": "${path.join(__dirname, `/__helpers__/project-3/index`)}",
        "@ts-jest/project-4": "${path.join(__dirname, `/__helpers__/project-4/someDir/index`)}",
      }
    `)
  })
})

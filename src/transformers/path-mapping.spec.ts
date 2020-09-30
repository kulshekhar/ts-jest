import { testing } from 'bs-logger'
import { join } from 'path'
import tsc from 'typescript'

import * as pathMapping from './path-mapping'
import { createConfigSet } from '../__helpers__/fakers'
import { normalizeSlashes } from '../utils/normalize-slashes'

const logger = testing.createLoggerMock()
const TS_JS_CODE_WITH_PATH_ALIAS = `
  import { parse } from '@utils/json'
  import hoo from '@utils/json'
  import * as json from '@utils/json'
  export * as jsonUtils from '@utils/json'
  const { stringify } = require('@utils/json')
  import foo = require('@utils/json')
  import('@utils/json').then(module => {
    module.parse('{foo:1}')
  })
  import type { Foo}  from '@utils/json'
  stringify({ foo: 1 })
  parse('{foo:1}')
  console.log(json)
  console.log(foo)
  const bar: Foo = { foo: 2 }
  hoo.foo(1)
`

describe('path-mapping', () => {
  test('should have correct signature', () => {
    expect(pathMapping.name).toBe('path-mapping')
    expect(typeof pathMapping.version).toBe('number')
    expect(pathMapping.version).toBeGreaterThan(0)
    expect(typeof pathMapping.factory).toBe('function')
  })

  test.each([
    {
      baseUrl: '.',
      paths: {
        '@utils/*': ['src/utils/*'],
      },
    },
    {
      rootDirs: ['./', 'foo'],
      baseUrl: '.',
      paths: {
        '@utils/*': ['src/utils/*'],
      },
    },
  ])(
    'should replace alias path with relative path which is resolved from paths tsconfig with js/ts extension',
    (tsConfig) => {
      const configSet = createConfigSet({
        tsJestConfig: {
          tsConfig,
        },
        logger,
      })
      const createFactory = () => pathMapping.factory(configSet)
      const transpile = (source: string) => tsc.transpileModule(source, { transformers: { before: [createFactory()] } })
      jest.spyOn(tsc, 'resolveModuleName').mockReturnValue({
        resolvedModule: {
          resolvedFileName: require.resolve('../utils/json'),
          extension: 'ts',
        } as any,
      })
      const out = transpile(TS_JS_CODE_WITH_PATH_ALIAS)

      expect(normalizeSlashes(out.outputText).replace(/\/\//g, '/')).toMatchSnapshot()

      jest.resetAllMocks()
    },
  )

  test.each([
    {
      code: `
        import styles from '@utils/app.css'

        console.log(styles)
      `,
      extension: 'css',
    },
    {
      code: `
        import jsonData from '@utils/data.json'

        console.log(jsonData)
      `,
      extension: 'json',
    },
    {
      code: `
        import vueComponent from '@utils/component.vue'

        console.log(vueComponent)
      `,
      extension: 'vue',
    },
  ])(
    'should replace alias path with relative path which is resolved from paths tsconfig with custom extensions',
    ({ code, extension }) => {
      const configSet = createConfigSet({
        tsJestConfig: {
          tsConfig: {
            baseUrl: '.',
            paths: {
              '@utils/*': ['src/utils/*'],
            },
          },
        },
        logger,
      })
      const createFactory = () => pathMapping.factory(configSet)
      const transpile = (source: string) => tsc.transpileModule(source, { transformers: { before: [createFactory()] } })
      const resolvedFileNameStub = join('..', `utils/json.${extension}`)
      jest.spyOn(tsc, 'resolveModuleName').mockReturnValue({
        resolvedModule: {
          resolvedFileName: resolvedFileNameStub,
          extension,
        } as any,
      })

      const out = transpile(code)

      expect(normalizeSlashes(out.outputText).replace(/\/\//g, '/')).toMatchSnapshot()

      jest.resetAllMocks()
    },
  )
})

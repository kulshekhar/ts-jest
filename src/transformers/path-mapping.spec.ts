import path from 'path'

import ts from 'typescript'

import { createConfigSet, makeCompiler } from '../__helpers__/fakers'
import { TsCompiler } from '../compiler/ts-compiler'
import { normalizeSlashes } from '../utils/normalize-slashes'

import { factory as pathMapping, name, version } from './path-mapping'

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

const printer = ts.createPrinter()

describe('path-mapping', () => {
  test('should have correct transformer name and version', () => {
    expect(name).toBe('path-mapping')
    expect(version).toBe(2)
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
    (tsconfig) => {
      const configSet = createConfigSet({
        tsJestConfig: {
          tsconfig,
        },
      })
      const createFactory = () => pathMapping(new TsCompiler(configSet, new Map()))
      const transpile = (source: string) => ts.transpileModule(source, { transformers: { before: [createFactory()] } })
      jest.spyOn(ts, 'resolveModuleName').mockReturnValue({
        resolvedModule: {
          resolvedFileName: require.resolve('../utils/json'),
          extension: 'ts',
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
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
      const resolvedFileNameStub = path.join('..', `utils/json.${extension}`)
      jest.spyOn(ts, 'resolveModuleName').mockReturnValue({
        resolvedModule: {
          resolvedFileName: resolvedFileNameStub,
          extension,
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      })
      const sourceFile = ts.createSourceFile(__filename, code, ts.ScriptTarget.ES2015)
      const result = ts.transform(sourceFile, [
        pathMapping(
          makeCompiler({
            tsJestConfig: {
              tsconfig: {
                baseUrl: '.',
                paths: {
                  '@utils/*': ['src/utils/*'],
                },
              },
            },
          }),
        ),
      ])

      const transformedSourceFile = result.transformed[0]

      expect(printer.printFile(transformedSourceFile).replace(/\\\\/g, '/')).toMatchSnapshot()
    },
  )
})

import path from 'node:path'

import { vol } from 'memfs'
import type { PackageJson } from 'type-fest'
import ts from 'typescript'

import { workspaceRoot } from '../../__helpers__/workspace-root'

import { tsTranspileModule } from './transpile-module'

jest.mock('fs', () => {
  const fsImpl = jest.requireActual('memfs').fs

  return {
    ...fsImpl,
    readFileSync: (path: string) => {
      if (path.includes('.ts-jest-digest')) {
        return 'ee2e176d55f97f10ef48a41f4e4089940db5d10f'
      }

      return fsImpl.readFileSync(path)
    },
  }
})
jest.mock('node:fs', () => {
  const fsImpl = jest.requireActual('memfs').fs

  return {
    ...fsImpl,
    readFileSync: (path: string) => {
      if (path.includes('.ts-jest-digest')) {
        return 'ee2e176d55f97f10ef48a41f4e4089940db5d10f'
      }

      return fsImpl.readFileSync(path)
    },
  }
})

function dedent(strings: TemplateStringsArray, ...values: unknown[]) {
  let joinedString = ''
  for (let i = 0; i < values.length; i++) {
    joinedString += `${strings[i]}${values[i]}`
  }
  joinedString += strings[strings.length - 1]

  return omitLeadingWhitespace(joinedString)
}

function omitLeadingWhitespace(text: string): string {
  return text.replace(/^\s+/gm, '')
}

describe('transpileModules', () => {
  describe('with modern Node resolution', () => {
    const tsFilePathInEsmModernNode = path.join(workspaceRoot, 'esm-node-modern', 'foo.ts')
    const mtsFilePath = path.join(workspaceRoot, 'foo.mts')
    const tsFilePathInCjsModernNode = path.join(workspaceRoot, 'cjs-node-modern', 'foo.ts')
    const ctsFilePath = path.join(workspaceRoot, 'foo.cts')
    beforeEach(() => {
      vol.reset()
      vol.fromJSON(
        {
          './esm-node-modern/package.json': JSON.stringify({
            name: 'test-package-1',
            type: 'module',
          } as PackageJson),
          './esm-node-modern/foo.ts': `
          import { foo } from 'foo';

          console.log(foo);
          const loadFooAsync = async () => {
             const fooDefault = await import('foo');
             console.log(fooDefault);
          }
          console.log(loadFooAsync());
        `,
          './foo.mts': `
          import { foo } from 'foo';

          console.log(foo);
          const loadFooAsync = async () => {
             const fooDefault = await import('foo');
             console.log(fooDefault);
          }
          console.log(loadFooAsync());
        `,
          './cjs-node-modern/package.json': JSON.stringify({
            name: 'test-package-1',
            type: 'commonjs',
          } as PackageJson),
          './cjs-node-modern/foo.ts': `
          import { foo } from 'foo';

          console.log(foo);
          const loadFooAsync = async () => {
             const fooDefault = await import('foo');
             console.log(fooDefault);
          }
          console.log(loadFooAsync());
        `,
          './foo.cts': `
          import { foo } from 'foo';

          console.log(foo);
          const loadFooAsync = async () => {
             const fooDefault = await import('foo');
             console.log(fooDefault);
          }
          console.log(loadFooAsync());
        `,
        },
        workspaceRoot,
      )
    })

    it.each([
      {
        module: ts.ModuleKind.Node16,
      },
      {
        module: ts.ModuleKind.NodeNext,
      },
    ])('should emit CJS code with "type: commonjs" in package.json', ({ module }) => {
      const result = tsTranspileModule(vol.readFileSync(tsFilePathInCjsModernNode, 'utf-8').toString(), {
        fileName: tsFilePathInCjsModernNode,
        compilerOptions: {
          module,
          target: ts.ScriptTarget.ESNext,
          verbatimModuleSyntax: true,
        },
      })

      expect(omitLeadingWhitespace(result.outputText)).toContain(dedent`
        const foo_1 = require("foo");
        console.log(foo_1.foo);
        const loadFooAsync = async () => {
          const fooDefault = await import('foo');
          console.log(fooDefault);
        };
        console.log(loadFooAsync());
      `)
    })

    it.each([
      {
        module: ts.ModuleKind.Node16,
      },
      {
        module: ts.ModuleKind.NodeNext,
      },
    ])('should emit ESM code with "type: module" in package.json', ({ module }) => {
      const result = tsTranspileModule(vol.readFileSync(tsFilePathInEsmModernNode, 'utf-8').toString(), {
        fileName: tsFilePathInEsmModernNode,
        compilerOptions: {
          module,
          target: ts.ScriptTarget.ESNext,
        },
      })

      expect(omitLeadingWhitespace(result.outputText)).toContain(dedent`
        import { foo } from 'foo';
        console.log(foo);
        const loadFooAsync = async () => {
          const fooDefault = await import('foo');
          console.log(fooDefault);
        };
        console.log(loadFooAsync());
      `)
    })

    it.each([
      {
        module: ts.ModuleKind.Node16,
        expectedResult: dedent`
          import { foo } from 'foo';
          console.log(foo);
          const loadFooAsync = async () => {
            const fooDefault = await import('foo');
            console.log(fooDefault);
          };
          console.log(loadFooAsync());
        `,
      },
      {
        module: ts.ModuleKind.ES2020,
        expectedResult: dedent`
          import { foo } from 'foo';
          console.log(foo);
          const loadFooAsync = async () => {
            const fooDefault = await import('foo');
            console.log(fooDefault);
          };
          console.log(loadFooAsync());
        `,
      },
      {
        module: undefined,
        expectedResult: dedent`
          import { foo } from 'foo';
          console.log(foo);
          const loadFooAsync = async () => {
            const fooDefault = await import('foo');
            console.log(fooDefault);
          };
          console.log(loadFooAsync());
        `,
      },
    ])('should emit code with ".mts" extension respecting module option', ({ module, expectedResult }) => {
      const result = tsTranspileModule(vol.readFileSync(mtsFilePath, 'utf-8').toString(), {
        fileName: mtsFilePath,
        compilerOptions: {
          module,
          target: ts.ScriptTarget.ESNext,
        },
      })

      expect(omitLeadingWhitespace(result.outputText)).toContain(expectedResult)
    })

    it.each([
      {
        module: ts.ModuleKind.Node16,
        expectedResult: dedent`
          const foo_1 = require("foo");
          console.log(foo_1.foo);
          const loadFooAsync = async () => {
            const fooDefault = await import('foo');
            console.log(fooDefault);
          };
          console.log(loadFooAsync());
        `,
      },
      {
        module: ts.ModuleKind.ES2020,
        expectedResult: dedent`
          import { foo } from 'foo';
          console.log(foo);
          const loadFooAsync = async () => {
            const fooDefault = await import('foo');
            console.log(fooDefault);
          };
          console.log(loadFooAsync());
        `,
      },
      {
        module: undefined,
        expectedResult: dedent`
          import { foo } from 'foo';
          console.log(foo);
          const loadFooAsync = async () => {
            const fooDefault = await import('foo');
            console.log(fooDefault);
          };
          console.log(loadFooAsync());
        `,
      },
    ])('should emit code with ".cts" extension respecting module option', ({ module, expectedResult }) => {
      const result = tsTranspileModule(vol.readFileSync(ctsFilePath, 'utf-8').toString(), {
        fileName: ctsFilePath,
        compilerOptions: {
          module,
          target: ts.ScriptTarget.ESNext,
        },
      })

      expect(omitLeadingWhitespace(result.outputText)).toContain(expectedResult)
    })
  })

  describe('with classic CommonJS module and ES module kind', () => {
    const filePath = path.join(workspaceRoot, 'bar.ts')

    beforeEach(() => {
      vol.reset()
      vol.fromJSON(
        {
          './bar.ts': `
          import { foo } from 'foo';

          console.log(foo);
          const loadFooAsync = async () => {
             const fooDefault = await import('foo');
             console.log(fooDefault);
          }
          console.log(loadFooAsync());
        `,
        },
        workspaceRoot,
      )
    })

    it('should emit CJS code with module kind set to CommonJS', () => {
      const result = tsTranspileModule(vol.readFileSync(filePath, 'utf-8').toString(), {
        fileName: filePath,
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ESNext,
        },
      })

      expect(omitLeadingWhitespace(result.outputText)).toContain(dedent`
          const foo_1 = require("foo");
          console.log(foo_1.foo);
          const loadFooAsync = async () => {
            const fooDefault = await Promise.resolve().then(() => require('foo'));
            console.log(fooDefault);
          };
          console.log(loadFooAsync());
      `)
    })

    it('should emit ESM code with module kind set to one of ES module value', () => {
      const result = tsTranspileModule(vol.readFileSync(filePath, 'utf-8').toString(), {
        fileName: filePath,
        compilerOptions: {
          module: ts.ModuleKind.ES2022,
          target: ts.ScriptTarget.ESNext,
        },
      })

      expect(omitLeadingWhitespace(result.outputText)).toContain(dedent`
          import { foo } from 'foo';
          console.log(foo);
          const loadFooAsync = async () => {
            const fooDefault = await import('foo');
            console.log(fooDefault);
          };
          console.log(loadFooAsync());
      `)
    })
  })

  describe('with diagnostics', () => {
    const testFilePath = path.join(workspaceRoot, 'foo.ts')
    beforeEach(() => {
      vol.reset()
      vol.fromJSON(
        {
          './foo.ts': `
        import { foo } from 'foo';

        console.log(foo);
      `,
        },
        workspaceRoot,
      )
    })

    it('should return diagnostics for invalid combination of compiler options', () => {
      const result = tsTranspileModule(vol.readFileSync(testFilePath, 'utf-8').toString(), {
        fileName: testFilePath,
        compilerOptions: {
          module: ts.ModuleKind.Node16,
          moduleResolution: ts.ModuleResolutionKind.Classic,
        },
      })

      expect(result.diagnostics?.[0].messageText).toBeTruthy()
    })
  })
})

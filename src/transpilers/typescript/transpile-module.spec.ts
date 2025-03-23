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
    const esmModernNodeFilePath = path.join(workspaceRoot, 'esm-node-modern', 'foo.ts')
    const mtsFilePath = path.join(workspaceRoot, 'esm-node-modern', 'foo.mts')
    const cjsModernNodeFilePath = path.join(workspaceRoot, 'cjs-node-modern', 'foo.ts')
    const ctsFilePath = path.join(workspaceRoot, 'esm-node-modern', 'foo.cts')
    vol.fromJSON(
      {
        './esm-node-modern/package.json': JSON.stringify({
          name: 'test-package-1',
          type: 'module',
        } as PackageJson),
        './esm-node-modern/foo.ts': `
          import { foo } from 'foo';

          console.log(foo);
        `,
        './esm-node-modern/foo.mts': `
          import { foo } from 'foo';

          console.log(foo);
        `,
        './cjs-node-modern/package.json': JSON.stringify({
          name: 'test-package-1',
          type: 'commonjs',
        } as PackageJson),
        './cjs-node-modern/foo.ts': `
          import { foo } from 'foo';

          console.log(foo);
        `,
        './esm-node-modern/foo.cts': `
          import { foo } from 'foo';

          console.log(foo);
        `,
      },
      workspaceRoot,
    )

    it.each([
      {
        module: ts.ModuleKind.Node16,
        moduleResolution: ts.ModuleResolutionKind.Node16,
      },
      {
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
      },
    ])('should emit CJS code with "type: commonjs" in package.json', ({ module, moduleResolution }) => {
      const result = tsTranspileModule(vol.readFileSync(cjsModernNodeFilePath, 'utf-8').toString(), {
        fileName: cjsModernNodeFilePath,
        compilerOptions: {
          module,
          target: ts.ScriptTarget.ESNext,
          verbatimModuleSyntax: true,
          moduleResolution,
        },
      })

      expect(omitLeadingWhitespace(result.outputText)).toContain(dedent`
        const foo_1 = require("foo");
      `)
    })

    it.each([
      {
        module: ts.ModuleKind.Node16,
        moduleResolution: ts.ModuleResolutionKind.Node16,
      },
      {
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
      },
    ])('should emit ESM code with "type: module" in package.json', ({ module, moduleResolution }) => {
      const result = tsTranspileModule(vol.readFileSync(esmModernNodeFilePath, 'utf-8').toString(), {
        fileName: esmModernNodeFilePath,
        compilerOptions: {
          module,
          target: ts.ScriptTarget.ESNext,
          moduleResolution,
        },
      })

      expect(omitLeadingWhitespace(result.outputText)).toContain(dedent`
        import { foo } from 'foo';
      `)
    })

    it('should emit ESM code with .mts extension', () => {
      const result = tsTranspileModule(vol.readFileSync(mtsFilePath, 'utf-8').toString(), {
        fileName: mtsFilePath,
        compilerOptions: {
          target: ts.ScriptTarget.ESNext,
        },
      })

      expect(omitLeadingWhitespace(result.outputText)).toContain(dedent`
        import { foo } from 'foo';
      `)
    })

    it('should emit CJS code with .cts extension', () => {
      const result = tsTranspileModule(vol.readFileSync(ctsFilePath, 'utf-8').toString(), {
        fileName: ctsFilePath,
        compilerOptions: {
          target: ts.ScriptTarget.ESNext,
        },
      })

      expect(omitLeadingWhitespace(result.outputText)).toContain(dedent`
        import { foo } from 'foo';
      `)
    })
  })

  describe('with classic CommonJS module and ES module kind', () => {
    vol.fromJSON(
      {
        './foo.ts': `
          import { foo } from 'foo';

          console.log(foo);
        `,
      },
      workspaceRoot,
    )

    it('should emit CJS code with module kind set to CommonJS', () => {
      const filePath = path.join(workspaceRoot, 'foo.ts')
      const result = tsTranspileModule(vol.readFileSync(filePath, 'utf-8').toString(), {
        fileName: filePath,
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ESNext,
        },
      })

      expect(omitLeadingWhitespace(result.outputText)).toContain(dedent`
        const foo_1 = require("foo");
      `)
    })

    it('should emit ESM code with module kind set to one of ES module value', () => {
      const filePath = path.join(workspaceRoot, 'foo.ts')
      const result = tsTranspileModule(vol.readFileSync(filePath, 'utf-8').toString(), {
        fileName: filePath,
        compilerOptions: {
          module: ts.ModuleKind.ES2022,
          target: ts.ScriptTarget.ESNext,
        },
      })

      expect(omitLeadingWhitespace(result.outputText)).toContain(dedent`
        import { foo } from 'foo';
      `)
    })
  })

  describe('with diagnostics', () => {
    const testFilePath = path.join(workspaceRoot, 'foo.ts')
    vol.fromJSON(
      {
        './foo.ts': `
        import { foo } from 'foo';

        console.log(foo);
      `,
      },
      workspaceRoot,
    )

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

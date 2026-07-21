const path = require('node:path')

const rootDir = __dirname
const transformerPath = path.join(rootDir, '../../dist')
const astTransformerPath = path.join(rootDir, 'transformer.cjs')

module.exports = ({ esm, isolatedModules }) => ({
  rootDir,
  extensionsToTreatAsEsm: esm ? ['.ts'] : [],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/__tests__/compat.spec.ts', ...(esm ? [] : ['<rootDir>/__tests__/hoist.spec.ts'])],
  transform: {
    '^.+\\.ts$': [
      transformerPath,
      {
        astTransformers: {
          before: [
            {
              path: astTransformerPath,
              options: { expectProgram: !isolatedModules },
            },
          ],
        },
        tsconfig: path.join(
          rootDir,
          esm
            ? isolatedModules
              ? 'tsconfig-esm-isolated.json'
              : 'tsconfig-esm.json'
            : isolatedModules
            ? 'tsconfig-cjs-isolated.json'
            : 'tsconfig-cjs.json',
        ),
        useESM: esm,
      },
    ],
  },
})

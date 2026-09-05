import { vol } from 'memfs'

import { resetTypeModuleCacheForTesting } from './find-type-module-packages'
import { nodeModulesTransformPattern } from './node-modules-transform-pattern'

jest.mock('fs', () => {
  const memfsFs = require('memfs').fs

  return {
    ...memfsFs,
    readdirSync: jest.fn((...args: Parameters<typeof memfsFs.readdirSync>) => memfsFs.readdirSync(...args)),
  }
})

const CWD = '/fixture'

const FIXTURE_FS = {
  [`${CWD}/node_modules/esm-pkg/package.json`]:
    '{"name":"esm-pkg","version":"1.0.0","type":"module","main":"index.js"}',
  [`${CWD}/node_modules/esm-pkg/index.js`]: '',
  [`${CWD}/node_modules/cjs-pkg/package.json`]: '{"name":"cjs-pkg","version":"1.0.0","main":"index.js"}',
  [`${CWD}/node_modules/cjs-pkg/index.js`]: '',
  [`${CWD}/node_modules/no-type-pkg/package.json`]: '{"name":"no-type-pkg","version":"1.0.0"}',
  [`${CWD}/node_modules/parent-pkg/package.json`]: '{"name":"parent-pkg","version":"1.0.0"}',
  // folder name differs from package.json "name" — the bug this test covers
  [`${CWD}/node_modules/@scope/esm-scoped/package.json`]: '{"name":"esm-scoped-alias","type":"module"}',
  [`${CWD}/node_modules/@scope/esm-scoped/index.js`]: '',
}

describe('nodeModulesTransformPattern', () => {
  beforeEach(() => {
    vol.reset()
    vol.fromJSON(FIXTURE_FS)
    resetTypeModuleCacheForTesting()
  })

  afterAll(() => {
    vol.reset()
  })

  it('returns plain /node_modules/ with no exemptions', () => {
    expect(nodeModulesTransformPattern()).toBe('/node_modules/')
  })

  describe('packageNames', () => {
    it('exempts named extras', () => {
      const re = new RegExp(nodeModulesTransformPattern({ packageNames: ['esm-pkg'] }))
      expect(re.test('/repo/node_modules/esm-pkg/index.js')).toBe(false)
      expect(re.test('/repo/node_modules/cjs-pkg/index.js')).toBe(true)
    })

    it('escapes regex metacharacters in package names', () => {
      const re = new RegExp(nodeModulesTransformPattern({ packageNames: ['zone.js'] }))
      expect(re.test('/repo/node_modules/zone.js/index.js')).toBe(false)
      expect(re.test('/repo/node_modules/zonexjs/index.js')).toBe(true)
    })
  })

  describe('typeModulePackages', () => {
    it('finds top-level "type":"module" packages', () => {
      const re = new RegExp(nodeModulesTransformPattern({ typeModulePackages: true, nodeModulesPath: CWD }))
      expect(re.test('/x/node_modules/esm-pkg/index.js')).toBe(false)
      expect(re.test('/x/node_modules/cjs-pkg/index.js')).toBe(true)
      expect(re.test('/x/node_modules/no-type-pkg/index.js')).toBe(true)
    })

    it('exempts by folder path, not package.json name, so scoped packages with mismatched names work', () => {
      const re = new RegExp(nodeModulesTransformPattern({ typeModulePackages: true, nodeModulesPath: CWD }))
      // folder is @scope/esm-scoped; package.json name is esm-scoped-alias (different)
      expect(re.test('/x/node_modules/@scope/esm-scoped/index.js')).toBe(false)
      expect(re.test('/x/node_modules/esm-scoped-alias/index.js')).toBe(true)
    })
  })

  describe('mjsPackages', () => {
    it('exempts .mjs files from any package', () => {
      const re = new RegExp(nodeModulesTransformPattern({ mjsPackages: true }))
      expect(re.test('/x/node_modules/some-pkg/index.mjs')).toBe(false)
      expect(re.test('/x/node_modules/some-pkg/index.js')).toBe(true)
    })

    it('still ignores .js files from packages not otherwise exempted', () => {
      const re = new RegExp(nodeModulesTransformPattern({ mjsPackages: true }))
      expect(re.test('/x/node_modules/cjs-pkg/index.js')).toBe(true)
    })

    it('combines with packageNames', () => {
      const re = new RegExp(nodeModulesTransformPattern({ mjsPackages: true, packageNames: ['esm-pkg'] }))
      expect(re.test('/x/node_modules/esm-pkg/index.js')).toBe(false)
      expect(re.test('/x/node_modules/some-pkg/index.mjs')).toBe(false)
      expect(re.test('/x/node_modules/cjs-pkg/index.js')).toBe(true)
    })

    it('combines with typeModulePackages', () => {
      const re = new RegExp(
        nodeModulesTransformPattern({ mjsPackages: true, typeModulePackages: true, nodeModulesPath: CWD }),
      )
      expect(re.test('/x/node_modules/esm-pkg/index.js')).toBe(false)
      expect(re.test('/x/node_modules/some-pkg/index.mjs')).toBe(false)
      expect(re.test('/x/node_modules/cjs-pkg/index.js')).toBe(true)
    })
  })
})

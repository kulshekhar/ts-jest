import * as fs from 'fs'

import { vol } from 'memfs'

import { findTypeModulePackages, resetTypeModuleCacheForTesting } from './find-type-module-packages'

jest.mock('fs', () => {
  const memfsFs = require('memfs').fs

  return {
    ...memfsFs,
    readdirSync: jest.fn((...args: Parameters<typeof memfsFs.readdirSync>) => memfsFs.readdirSync(...args)),
  }
})

const ROOT = '/project'
const NM = `${ROOT}/node_modules`

describe('findTypeModulePackages', () => {
  beforeEach(() => {
    vol.reset()
    resetTypeModuleCacheForTesting()
  })

  afterAll(() => {
    vol.reset()
  })

  it('returns empty array when node_modules does not exist', () => {
    vol.fromJSON({})
    expect(findTypeModulePackages(ROOT)).toEqual([])
  })

  it('returns empty array when no packages have type:module', () => {
    vol.fromJSON({
      [`${NM}/cjs-pkg/package.json`]: '{"name":"cjs-pkg","main":"index.js"}',
      [`${NM}/no-type-pkg/package.json`]: '{"name":"no-type-pkg","version":"1.0.0"}',
    })
    expect(findTypeModulePackages(ROOT)).toEqual([])
  })

  it('returns relative folder names of type:module packages', () => {
    vol.fromJSON({
      [`${NM}/esm-pkg/package.json`]: '{"name":"esm-pkg","type":"module"}',
      [`${NM}/cjs-pkg/package.json`]: '{"name":"cjs-pkg"}',
    })
    expect(findTypeModulePackages(ROOT)).toEqual(['esm-pkg'])
  })

  it('uses folder name, not package.json name field', () => {
    vol.fromJSON({
      [`${NM}/folder-name/package.json`]: '{"name":"different-name","type":"module"}',
    })
    const result = findTypeModulePackages(ROOT)
    expect(result).toContain('folder-name')
    expect(result).not.toContain('different-name')
  })

  it('handles scoped packages', () => {
    vol.fromJSON({
      [`${NM}/@scope/esm-scoped/package.json`]: '{"name":"esm-scoped","type":"module"}',
      [`${NM}/@scope/cjs-scoped/package.json`]: '{"name":"cjs-scoped"}',
    })
    expect(findTypeModulePackages(ROOT)).toEqual(['@scope/esm-scoped'])
  })

  it('skips dot-prefixed entries', () => {
    vol.fromJSON({
      [`${NM}/.bin/somefile`]: '',
      [`${NM}/real-pkg/package.json`]: '{"type":"module"}',
    })
    expect(findTypeModulePackages(ROOT)).toEqual(['real-pkg'])
  })

  it('handles malformed package.json gracefully', () => {
    vol.fromJSON({
      [`${NM}/bad-json/package.json`]: 'not valid json',
      [`${NM}/good-pkg/package.json`]: '{"type":"module"}',
    })
    expect(findTypeModulePackages(ROOT)).toEqual(['good-pkg'])
  })

  it('handles missing package.json gracefully', () => {
    vol.fromJSON({
      [`${NM}/no-manifest/index.js`]: '',
      [`${NM}/esm-pkg/package.json`]: '{"type":"module"}',
    })
    expect(findTypeModulePackages(ROOT)).toEqual(['esm-pkg'])
  })

  it('caches results and skips re-scan on second call', () => {
    vol.fromJSON({
      [`${NM}/esm-pkg/package.json`]: '{"type":"module"}',
    })
    const readdirSpy = fs.readdirSync as jest.Mock
    readdirSpy.mockClear()
    findTypeModulePackages(ROOT)
    const firstCount = readdirSpy.mock.calls.length
    findTypeModulePackages(ROOT)
    expect(readdirSpy.mock.calls.length).toBe(firstCount)
  })

  it('scans independently for different nodeModulesPath values', () => {
    const ROOT2 = '/project2'
    const NM2 = `${ROOT2}/node_modules`
    vol.fromJSON({
      [`${NM}/esm-pkg/package.json`]: '{"type":"module"}',
      [`${NM2}/other-esm/package.json`]: '{"type":"module"}',
    })
    expect(findTypeModulePackages(ROOT)).toEqual(['esm-pkg'])
    expect(findTypeModulePackages(ROOT2)).toEqual(['other-esm'])
  })

  it('resetTypeModuleCacheForTesting clears cache', () => {
    vol.fromJSON({
      [`${NM}/esm-pkg/package.json`]: '{"type":"module"}',
    })
    findTypeModulePackages(ROOT)
    const readdirSpy = fs.readdirSync as jest.Mock
    readdirSpy.mockClear()
    resetTypeModuleCacheForTesting()
    findTypeModulePackages(ROOT)
    expect(readdirSpy.mock.calls.length).toBeGreaterThan(0)
  })
})

import dns from 'dns'
// the point here is that it's the node core module
// eslint-disable-next-line no-restricted-imports
import { readFileSync } from 'fs'
import { createRequire } from 'module'
import prefixDns from 'node:dns'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

import { jest as jestObject } from '@jest/globals'

import staticImportedStatefulFromCjs from '../from-cjs.mjs'
import { double } from '../index'
import defaultFromCjs, { half, namedFunction } from '../named-export.cjs'
import { bag } from '../namespace-export'
import staticImportedStateful from '../stateful.mjs'
// @ts-expect-error testing purpose
import staticImportedStatefulWithQuery from '../stateful.mjs?query=1'
// @ts-expect-error testing purpose
import staticImportedStatefulWithAnotherQuery from '../stateful.mjs?query=2'

test('should have correct import.meta', () => {
  expect(typeof require).toBe('undefined')
  expect(typeof jest).toBe('undefined')
  expect(import.meta).toEqual({
    jest: expect.anything(),
    url: expect.any(String),
  })
  // @ts-expect-error `jest` exists in import.meta in Jest 28
  expect(import.meta.jest).toBe(jestObject)
  expect(import.meta.url.endsWith('/e2e/native-esm-js/__tests__/native-esm.spec.ts')).toBe(true)
})

test('should double stuff', () => {
  expect(double(1)).toBe(2)
})

test('should support importing node core modules', () => {
  const dir = dirname(fileURLToPath(import.meta.url))
  const packageJsonPath = resolve(dir, '../package.json')

  expect(JSON.parse(readFileSync(packageJsonPath, 'utf8'))).toEqual({
    type: 'module',
  })
})

test('should support importing node core modules dynamically', async () => {
  // it's important that this module has _not_ been imported at the top level
  const assert = await import('assert')

  expect(typeof assert.strictEqual).toBe('function')
})

test('dynamic import should work', async () => {
  const { double: importedDouble } = await import('../index')

  expect(importedDouble).toBe(double)
  expect(importedDouble(1)).toBe(2)
})

test('import cjs', async () => {
  const { default: half } = await import('../commonjs.cjs')

  expect(half(4)).toBe(2)
})

test('import esm from cjs', async () => {
  const { default: halfPromise } = await import('../from-esm.cjs')

  expect(await halfPromise(1)).toBe(2)
})

test('require(cjs) and import(cjs) should share caches', async () => {
  const require = createRequire(import.meta.url)
  const { default: importedStateful } = await import('../stateful.cjs')
  const requiredStateful = require('../stateful.cjs')

  expect(importedStateful()).toBe(1)
  expect(importedStateful()).toBe(2)
  expect(requiredStateful()).toBe(3)
  expect(importedStateful()).toBe(4)
  expect(requiredStateful()).toBe(5)
  expect(requiredStateful()).toBe(6)
})

test('import from mjs and import(mjs) should share caches', async () => {
  const { default: importedStateful } = await import('../stateful.mjs')

  expect(importedStateful()).toBe(1)
  expect(importedStateful()).toBe(2)
  expect(staticImportedStateful()).toBe(3)
  expect(importedStateful()).toBe(4)
  expect(staticImportedStateful()).toBe(5)
  expect(staticImportedStateful()).toBe(6)
})

test('import cjs via import statement', () => {
  expect(staticImportedStatefulFromCjs(4)).toBe(2)
})

test('handle unlinked dynamic imports', async () => {
  const { double: deepDouble } = await import('../dynamic-import')

  expect(deepDouble).toBe(double)
  expect(deepDouble(4)).toBe(8)
})

test('can import `jest` object', () => {
  expect(jestObject).toBeDefined()
})

test('handle dynamic imports of the same module in parallel', async () => {
  const [{ double: first }, { double: second }] = await Promise.all([
    import('../another-dynamic-import.js'),
    import('../another-dynamic-import.js'),
  ])

  expect(first).toBe(second)
  expect(first(2)).toBe(4)
})

test('varies module cache by query', () => {
  expect(staticImportedStatefulWithQuery).not.toBe(staticImportedStatefulWithAnotherQuery)

  expect(staticImportedStatefulWithQuery()).toBe(1)
  expect(staticImportedStatefulWithQuery()).toBe(2)
  expect(staticImportedStatefulWithAnotherQuery()).toBe(1)
  expect(staticImportedStatefulWithQuery()).toBe(3)
  expect(staticImportedStatefulWithAnotherQuery()).toBe(2)
  expect(staticImportedStatefulWithAnotherQuery()).toBe(3)
})

test('supports named imports from CJS', () => {
  expect(half(4)).toBe(2)
  expect(namedFunction()).toBe('hello from a named CJS function!')
  expect(defaultFromCjs.default()).toBe('"default" export')
  expect(Object.keys(defaultFromCjs)).toEqual(['half', 'namedFunction', 'default'])
})

test('supports file urls as imports', async () => {
  // @ts-expect-error testing purpose
  const dynamic = await import(new URL('../stateful.mjs', import.meta.url))

  expect(dynamic.default).toBe(staticImportedStateful)
})

test('namespace export', () => {
  expect(bag.double).toBe(double)
})

test('handle circular dependency', async () => {
  const moduleA = (await import('../circular-dependent-a.mjs')).default

  expect(moduleA.id).toBe('circularDependentA')
  expect(moduleA.moduleB.id).toBe('circularDependentB')
  expect(moduleA.moduleB.moduleA).toBe(moduleA)
})

test('require of ESM should throw correct error', () => {
  const require = createRequire(import.meta.url)

  expect(() => require('../from-cjs.mjs')).toThrow(
    expect.objectContaining({
      code: 'ERR_REQUIRE_ESM',
      message: expect.stringContaining('Must use import to load ES Module'),
    }),
  )
})

test('can mock module', async () => {
  jestObject.unstable_mockModule('../mockedModule.mjs', () => ({ foo: 'bar' }), {
    virtual: true,
  })

  // @ts-expect-error `mockedModule.mjs` has no type definition associated
  const importedMock = await import('../mockedModule.mjs')

  expect(Object.keys(importedMock)).toEqual(['foo'])
  expect(importedMock.foo).toEqual('bar')
})

test('supports imports using "node:" prefix', () => {
  expect(dns).toBe(prefixDns)
})

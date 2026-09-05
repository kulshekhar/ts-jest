import { TsJestTransformer } from './legacy/ts-jest-transformer'

import tsJest, { MJS_NODE_MODULES_TRANSFORM, nodeModulesTransformPattern } from '.'

test('should create an instance of TsJestTransformer', () => {
  expect(tsJest.createTransformer()).toBeInstanceOf(TsJestTransformer)
})

it('exports nodeModulesTransformPattern', () => {
  expect(typeof nodeModulesTransformPattern).toBe('function')
})

it('exports MJS_NODE_MODULES_TRANSFORM', () => {
  expect(typeof MJS_NODE_MODULES_TRANSFORM).toBe('string')
})

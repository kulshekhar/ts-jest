import { TsJestTransformer } from './ts-jest-transformer'

import tsJest from '.'

test('should create an instance of TsJestTransformer', () => {
  expect(tsJest.createTransformer()).toBeInstanceOf(TsJestTransformer)
})

import { test, expect } from '@jest/globals'

import { double } from '../double.js'
import { quadruple } from '../quadruple/index.js'
import { triple } from '../triple.mjs'

test('double', () => {
  expect(double(2)).toBe(4)
})

test('triple', () => {
  expect(triple(2)).toBe(6)
})

test('quadruple', () => {
  expect(quadruple(2)).toBe(8)
})

test('import.meta', () => {
  expect(typeof import.meta.url).toBe('string')
})

import './sum-dependency'
require('./other-file')
require('./file')

export const uncoveredFunction = (): string => 1 + 'abc'

export const sum = (a: number, b: number): number => a + b

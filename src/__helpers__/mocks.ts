import { testing } from 'bs-logger'

import { rootLogger } from '../util/logger'

// typings helper
export function mocked<T>(val: T): T extends (...args: any[]) => any ? jest.MockInstance<T> : jest.Mocked<T> {
  return val as any
}
export function spied<T>(val: T): T extends (...args: any[]) => any ? jest.SpyInstance<T> : jest.Mocked<T> {
  return val as any
}

export const logTargetMock = () => (rootLogger as testing.LoggerMock).target

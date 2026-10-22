import { describe, expect, it, jest } from '@jest/globals'

import { rootLogger } from './logger'

jest.unmock('./logger')

// ths is just a simple test to ensure we do have a logger
describe('rootLogger', () => {
  it('should be a logger', () => {
    expect(typeof rootLogger).toBe('function')
  })

  it.each([undefined, 'stderr:warn'])('should leave TS_JEST_LOG unchanged when TS_JEST_DEBUG is set', (logTarget) => {
    const previousDebug = process.env.TS_JEST_DEBUG
    const previousLog = process.env.TS_JEST_LOG

    try {
      process.env.TS_JEST_DEBUG = 'true'
      if (logTarget === undefined) {
        delete process.env.TS_JEST_LOG
      } else {
        process.env.TS_JEST_LOG = logTarget
      }
      jest.isolateModules(() => {
        jest.requireActual('./logger')
      })

      expect(process.env.TS_JEST_DEBUG).toBe('true')
      expect(process.env.TS_JEST_LOG).toBe(logTarget)
    } finally {
      if (previousDebug === undefined) {
        delete process.env.TS_JEST_DEBUG
      } else {
        process.env.TS_JEST_DEBUG = previousDebug
      }
      if (previousLog === undefined) {
        delete process.env.TS_JEST_LOG
      } else {
        process.env.TS_JEST_LOG = previousLog
      }
    }
  })
})

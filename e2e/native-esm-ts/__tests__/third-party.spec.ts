import path from 'node:path'

import { it, describe, expect } from '@jest/globals'

import { fileName } from '../third-parties/dirname-filename-esm.js'
import { backend } from '../third-parties/i18next-fs-backend.js'

describe('Third parties', () => {
  it('should work with i18next-fs-backend', () => {
    expect(backend).toBeDefined()
  })

  it('should work with dirname-filename-esm', () => {
    expect(path.basename(fileName(import.meta))).toBe('third-party.spec.ts')
  })
})

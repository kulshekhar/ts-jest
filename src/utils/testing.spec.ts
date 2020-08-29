import { mocked } from './testing'

describe('mocked', () => {
  it('should return unmodified input', () => {
    const subject = {}
    expect(mocked(subject)).toBe(subject)
  })
})

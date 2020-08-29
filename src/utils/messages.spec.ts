import { interpolate } from './messages'

const MESSAGE_WITH_PARAMS = 'param1: {{param1}}, param2: {{param2}}, again param1: {{param1}}'

describe('interpolate', () => {
  it('should return string as-is when no var given', () => {
    expect(interpolate(MESSAGE_WITH_PARAMS)).toBe(MESSAGE_WITH_PARAMS)
  })
  it('should return string  with replaced vars', () => {
    expect(interpolate(MESSAGE_WITH_PARAMS, { param1: 1, param2: '2' })).toBe('param1: 1, param2: 2, again param1: 1')
    expect(interpolate(MESSAGE_WITH_PARAMS, { param1: 'p1' })).toBe('param1: p1, param2: {{param2}}, again param1: p1')
  })
})

import { BarConstEnum } from '../src/bar-constant'
import { FooConstEnum } from '../src/foo-constant'

describe('const-enum', () => {
  it('should pass with non transpilation mode', () => {
    expect(BarConstEnum.one).toBe('ONE')
    expect(FooConstEnum.two).toBe('TWO')
  })
})

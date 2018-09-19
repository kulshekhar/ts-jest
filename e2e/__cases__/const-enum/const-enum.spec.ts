import { getOne, getTwo } from './const-enum'

it('should pass', () => {
  expect(getOne()).toBe('ONE')
  expect(getTwo()).toBe('TWO')
})

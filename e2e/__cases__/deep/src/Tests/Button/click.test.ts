import { click } from '../../Button/click'

test('button should click!', () => {
  expect(click('bar')).toBe('clicked BAR')
})

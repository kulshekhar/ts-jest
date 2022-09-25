import { getWelcomeMessage } from './welcome-message'

test('should show welcome message', () => {
  expect(getWelcomeMessage()).toMatchInlineSnapshot(`"Welcome to ts-jest!!!"`)
})

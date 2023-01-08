import { getWelcomeMessage } from './welcome-message'

test('module: should show welcome message', () => {
  expect(getWelcomeMessage()).toMatchInlineSnapshot(`"Welcome to ts-jest!!!"`)
})

import { getWelcomeMessage } from './welcome-message'
import welcomePerson from './welcome-person'

test('module: should show welcome message', () => {
  expect(getWelcomeMessage()).toMatchInlineSnapshot(`"Welcome to ts-jest!!!"`)
})

test('module: should show welcome person message', () => {
  // @ts-expect-error in ESM mode, `default` is kept after compilation
  expect(welcomePerson.default ? welcomePerson.default : welcomePerson).toMatchInlineSnapshot(`"Welcome to ts-jest!!!"`)
})

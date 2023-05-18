import { test, expect } from '@jest/globals'

import { getWelcomeMessage } from '../../src/welcome-message'

test('should show welcome message', () => {
  expect(getWelcomeMessage()).toMatchInlineSnapshot(`"Welcome to ts-jest!!!"`)
})

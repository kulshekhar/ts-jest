import camelCase from 'lodash-es/camelCase'

import { getWelcomeMessage } from './welcome-message'

test('should show welcome message', () => {
  expect(camelCase(getWelcomeMessage())).toBe('welcomeToTsJest')
})

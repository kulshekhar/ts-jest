import { join } from 'path'
import { cwd } from 'process'

import { getWelcomeMessage, processFile } from './welcome-message'

test('should show welcome message', () => {
  expect(getWelcomeMessage()).toMatchInlineSnapshot(`"Welcome to ts-jest!!!"`)
})

test('should work with resource management', async () => {
  const result = await processFile(join(cwd(), 'src', 'data.txt'))

  expect(result).toContain('hello')
})

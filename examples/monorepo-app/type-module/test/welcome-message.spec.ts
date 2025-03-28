import { getWelcomeMessage } from '../../shared/src/welcome-message'

it('should show welcome message', async () => {
  const { getAsyncWelcomeMessage } = await import('../../shared/src/async-welcome-message')
  const defaultWelcomeMessage = await import('../../shared/src/default-welcome-message')

  expect(getWelcomeMessage()).toBe('Welcome to ts-jest!!!')
  await expect(getAsyncWelcomeMessage()).resolves.toBe('Welcome to ts-jest!!!')
  expect(defaultWelcomeMessage.default()).toBe('Welcome to ts-jest!!!')
})

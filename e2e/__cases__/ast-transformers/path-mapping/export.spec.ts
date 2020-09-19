import { getWelcomeMessage } from '@share/export'

test('should return welcome message', async () => {
  const userName = ''

  expect(getWelcomeMessage(userName)).toEqual(`yolo ${userName}`)
})

import { getWelcomeMessage } from '@share/foo'

test('should return welcome message', () => {
  const userName = 'github-user'

  expect(getWelcomeMessage(userName)).toEqual(`yolo ${userName}`)
})

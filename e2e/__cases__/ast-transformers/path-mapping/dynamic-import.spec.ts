test('should return welcome message', async () => {
  const userName = 'github-user'
  const foo = await import('@share/foo')

  expect(foo.getWelcomeMessage(userName)).toEqual(`yolo ${userName}`)
})

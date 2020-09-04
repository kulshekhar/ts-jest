import foo from '@share/foo'

test('should return welcome message', () => {
  const userName = 'github-user'

  expect(foo(userName)).toBe(`yolo ${userName}`)
})

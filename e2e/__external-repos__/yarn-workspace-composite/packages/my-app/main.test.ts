import { main } from './main'

test('main', () => {
  // eslint:disable-next-line:no-console
  const mockLog = console.log = jest.fn()

  main()
  expect(mockLog).toHaveBeenCalledTimes(1)
})

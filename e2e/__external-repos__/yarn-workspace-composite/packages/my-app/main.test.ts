import { main } from './main'

test('main', () => {
  const mockLog = console.log = jest.fn()

  main()
  expect(mockLog).toHaveBeenCalledTimes(1)
})

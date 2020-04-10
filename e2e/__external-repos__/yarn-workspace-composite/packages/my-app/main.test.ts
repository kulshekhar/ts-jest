import { main } from './main'

test('main', () => {
  // tslint:disable-next-line:no-console
  const mockLog = console.log = jest.fn()

  main()
  expect(mockLog).toHaveBeenCalledTimes(1)
})

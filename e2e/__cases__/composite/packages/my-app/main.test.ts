import { main } from './main';

test('main', () => {
  const mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});

  main();
  expect(mockLog).toHaveBeenCalledTimes(1);
});

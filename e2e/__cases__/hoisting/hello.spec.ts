import hello from './hello';

jest.mock('./hello');

describe('hello', () => {
  const original = require.requireActual('./hello').default;
  it('should have been mocked', () => {
    const msg = hello();
    expect(hello).not.toBe(original);
    expect(msg).toBeUndefined();
    expect(hello).toHaveProperty('mock');
  });
});

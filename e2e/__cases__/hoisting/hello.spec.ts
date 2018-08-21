import hello from './hello';

afterAll(() => {
  // this should go after
  const zz = 20;
  jest.unmock('./hello');
})

jest.mock('./hello');

describe('hello', () => {
  const original = require.requireActual('./hello').default;
  it('should have been mocked', () => {
    const msg = hello();
    expect(hello).not.toBe(original);
    expect(msg).toBeUndefined();
    expect(hello).toHaveProperty('mock');
    expect(require('foo')).toBe('bar');
    jest.mock('foo', () => 'bar', { virtual: true });
  });
});

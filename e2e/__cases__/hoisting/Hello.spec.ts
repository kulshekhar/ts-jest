import { Hello } from './Hello';

jest.mock('./Hello', () => ({ Hello() {} }));

describe('Hello Class', () => {
  // tslint:disable-next-line:variable-name
  const OriginalClass = require.requireActual('./Hello').Hello;
  it('should create a new mocked Hello', () => {
    const hello = new Hello('foo');
    expect(hello.msg).toBeUndefined();
    expect(hello).not.toBeInstanceOf(OriginalClass);
    expect(hello).toHaveProperty('mock');
  });
});

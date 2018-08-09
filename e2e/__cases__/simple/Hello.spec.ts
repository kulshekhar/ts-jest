import { Hello } from './Hello';

describe('Hello Class', () => {
  it('should create a new Hello', () => {
    const hello = new Hello('foo');
    expect(hello.msg).toBe('foo');
  });
});

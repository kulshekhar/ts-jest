import { Hello } from '../long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/Hello';

describe('Hello test in long path', () => {
  it('should work', () => {
    expect(new Hello().name).toEqual('John Doe');
  });
});

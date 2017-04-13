import { Hello } from '../Hello';

describe('Hello test in long path', () => {
  it('should work', () => {
    expect(new Hello().name).toEqual('John Doe');
  })
})

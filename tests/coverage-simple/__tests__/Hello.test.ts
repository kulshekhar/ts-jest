declare var jest, describe, it, expect;

import { Hello } from '../Hello';

describe('Hello Class', () => {
  it('should throw an error on line 18', () => {
    expect(() => new Hello()).toThrow();
  });
});

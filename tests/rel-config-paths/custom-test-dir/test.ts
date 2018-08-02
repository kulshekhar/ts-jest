declare var jest, describe, it, expect;

import { hi } from '../src';

describe('hi', () => {
  it('should say hi', () => {
    expect(hi()).toBe('HI!');
  });
});

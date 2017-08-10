declare var jest, describe, it, expect;

import { num } from '../Hello';

describe('Hello Class', () => {
  it('should throw warning for deprecated __TS_CONFIG__', () => {
    expect(num).toBe(2);
  });
});

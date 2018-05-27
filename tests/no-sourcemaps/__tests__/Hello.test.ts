declare var jest, describe, it, expect;

import { Hello } from '../Hello';

describe('Hello Class', () => {
  it('should NOT throw an error on line 18', () => {
    const hello = new Hello();
  });
});

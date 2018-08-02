declare var jest, describe, it, expect;

import pkg from '../pkg';

describe('pkg', () => {
  it('should statically import package.json', () => {
    expect(pkg).toEqual(require('../package.json'));
  });
});

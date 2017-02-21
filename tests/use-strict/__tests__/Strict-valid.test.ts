declare var jest, describe, it, expect;

import { checkStrictValid } from '../Strict-valid';

describe('Strict1', () => {

  it('should not throw an error', () => {

    checkStrictValid();

  });

});
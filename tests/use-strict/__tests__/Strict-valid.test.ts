declare var jest, describe, it, expect;

import { checkStrictValid } from '../Strict-valid';

describe('Valid Strict', () => {

  it('should not throw an error', () => {

    checkStrictValid();

  });

});
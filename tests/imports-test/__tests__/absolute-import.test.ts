declare var jest, describe, it, expect;

import { simpleFunction } from 'absolute-import';

describe('Simple function absolute', () => {

    it('should throw an error on line 11', () => {
        simpleFunction();
    });
});
declare var jest, describe, it, expect;

import { simpleFunction } from '../src/relative-import';

describe('Simple function relative', () => {

    it('should throw an error on line 11', () => {
        simpleFunction();
    });
});
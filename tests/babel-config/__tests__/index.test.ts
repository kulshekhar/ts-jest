import {Hello} from '../Hello';

describe('Hello Class', () => {

  it('should allow custom Babel config', () => {

    expect(typeof Hello).toBe('function');

  });

});

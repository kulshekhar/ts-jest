declare var jest, describe, it, expect;

import { Hello } from '../Hello';

describe('Hello Class', () => {

  it('should throw an error on line 13', () => {
    return new Promise((resolve: () => void) => {
      const hello = new Hello();
      resolve();
    });
  });

  it('should be succeded', () => {
    return new Promise((resolve: () => void) => {
      resolve();
    });
  });
});
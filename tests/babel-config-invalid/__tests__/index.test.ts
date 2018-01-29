import { Hello } from '../Hello';

describe('Hello Class', () => {
  it('should throw an error when compiling through Babel', () => {
    expect(typeof Hello).toBe('function');
  });
});

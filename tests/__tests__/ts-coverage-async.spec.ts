import runJest from '../__helpers__/runJest';

describe('hello_world', () => {

  it('should run successfully', () => {
    const result = runJest('../simple-async', ['--no-cache', '--coverage']);

    const output = result.stdout.toString();

    expect(output).toContain('Statements   : 66.67% ( 10/15 )');
    expect(output).toContain('Branches     : 33.33% ( 2/6 )');
    expect(output).toContain('Functions    : 66.67% ( 4/6 )');
    expect(output).toContain('Lines        : 61.54% ( 8/13 )');
  });

});

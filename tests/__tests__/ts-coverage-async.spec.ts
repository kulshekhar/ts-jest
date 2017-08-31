import runJest from '../__helpers__/runJest';

describe('Typescript async coverage', () => {
  it('Should generate the correct async coverage numbers', () => {
    const result = runJest('../simple-async', ['--no-cache', '--coverage']);

    const output = result.stdout.toString();

    expect(output).toContain('Statements   : 71.43% ( 10/14 )');
    expect(output).toContain('Branches     : 33.33% ( 2/6 )');
    expect(output).toContain('Functions    : 66.67% ( 4/6 )');
    expect(output).toContain('Lines        : 66.67% ( 8/12 )');
  });
});

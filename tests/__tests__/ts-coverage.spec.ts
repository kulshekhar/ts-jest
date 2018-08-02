import runJest from '../__helpers__/runJest';

describe('Typescript coverage', () => {
  it('Should generate the correct coverage numbers.', () => {
    const result = runJest('../simple', ['--no-cache', '--coverage']);

    const output = result.stdout;

    expect(output).toMatchSnapshot();
  });
});

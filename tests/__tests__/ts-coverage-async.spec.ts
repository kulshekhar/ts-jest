import runJest from '../__helpers__/runJest';

describe('Typescript async coverage', () => {
  it('Should generate the correct async coverage numbers', () => {
    const result = runJest('../simple-async', ['--no-cache', '--coverage']);

    const output = result.stdout;

    expect(output).toMatchSnapshot();
  });
});

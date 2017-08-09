import runJest from '../__helpers__/runJest';

describe('babelrc flag', () => {
  it('should crash on invalid babelrc', () => {
    const result = runJest('../use-babelrc', ['--no-cache', '-u']);
    const stderr = result.stderr.toString();
    expect(result.status).toBe(1);
    expect(stderr).toContain('ReferenceError: [BABEL]');
    expect(stderr).toContain(
      'Check out http://babeljs.io/docs/usage/options/ for more information about options.',
    );
  });

  it('Should not crash on invalid babelrc if useBabelrc is not set', () => {
    const result = runJest('../skip-babelrc', ['--no-cache', '-u']);

    expect(result.status).toBe(0);
  });
});

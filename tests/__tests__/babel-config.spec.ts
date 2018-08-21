import runJest from '../__helpers__/runJest';

describe('babelConfig flag', () => {
  it('should use a custom Babel config', () => {
    const result = runJest('../babel-config', ['--no-cache', '-u']);
    expect(result.status).toBe(0);
  });

  it('should fail for invalid babel configs', () => {
    const result = runJest('../babel-config-invalid', ['--no-cache', '-u']);
    const stderr = result.stderr;
    expect(result.status).toBe(1);
    expect(stderr).toContain('ReferenceError: Unknown option: .foo.');
    expect(stderr).toContain(
      'Check out http://babeljs.io/docs/usage/options/ for more information about options.',
    );
  });

  it('should not merge in .babelrc options when ommiting the useBabelrc option', () => {
    const result = runJest('../babel-config-merge-ignore-babelrc', [
      '--no-cache',
      '-u',
    ]);
    expect(result.status).toBe(0);
  });

  it('should merge in .babelrc options when using the useBabelrc option', () => {
    const result = runJest('../babel-config-merge-with-babelrc', [
      '--no-cache',
      '-u',
    ]);
    const stderr = result.stderr;
    expect(result.status).toBe(1);
    expect(stderr).toContain(`Cannot find module 'babel-preset-nonexistent'`);
  });
});

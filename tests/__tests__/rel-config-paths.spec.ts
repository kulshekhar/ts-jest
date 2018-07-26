import runJest from '../__helpers__/runJest';

describe('Use jest config from config dir', () => {
  it('Should run all tests resolving tsconfig extends', () => {
    const result = runJest('../rel-config-paths', [
      '--no-cache',
      '--config=./config/jest.config.js',
    ]);

    expect(result.status).toBe(0);
  });

  it('Should fail resolving tsconfig with wrong relative path', () => {
    const result = runJest('../rel-config-paths', [
      '--no-cache',
      '--config=./config/jest.config.invalid.js',
    ]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'Unable to find tsconfig file given "./tsconfig.test.json"',
    );
  });
});

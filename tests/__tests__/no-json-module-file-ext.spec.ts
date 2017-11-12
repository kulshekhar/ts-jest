import runJest from '../__helpers__/runJest';

// Regression test for
// https://github.com/kulshekhar/ts-jest/issues/367
describe('no json in moduleFileExtensions', () => {
  it('should run successfully', () => {
    const result = runJest('../no-json-module-file-ext', ['--no-cache']);
    expect(result.status).toBe(0);
  });
});

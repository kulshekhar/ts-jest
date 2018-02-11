import runJest from '../__helpers__/runJest';

describe('Jest Projects', () => {
  it('should compile typescript succesfully', () => {
    const result = runJest('../jest-projects', ['--no-cache']);
    const stderr = result.stderr;
    expect(result.status).toEqual(0);
    expect(stderr).toContain('1 passed, 1 total');
  });
});

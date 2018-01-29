import runJest from '../__helpers__/runJest';

describe('TS Compilation', () => {
  it('should compile typescript succesfully', () => {
    const result = runJest('../simple', ['--no-cache']);

    const stderr = result.stderr;

    expect(result.status).toBe(1);
    expect(stderr).toContain('1 failed, 1 total');
    expect(stderr).toContain('Hello Class');
    expect(stderr).toContain('should throw an error on line 18');
  });
});

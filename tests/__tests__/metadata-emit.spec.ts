import runJest from '../__helpers__/runJest';

describe('Metadata emit', () => {
  it('should run metadata emitting test successfuly', () => {
    const result = runJest('../metadata-emit', ['--no-cache']);
    const stderr = result.stderr;
    expect(result.status).toEqual(0);
    expect(stderr).toContain('6 passed, 6 total');
  });
});

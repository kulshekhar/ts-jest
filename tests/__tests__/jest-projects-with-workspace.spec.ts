import runJest from '../__helpers__/runJest';

describe('Jest Projects with workspace', () => {
  it('should find ./tsconfig.json in sub projects properly with jest projects and yarn workspace options', () => {
    const result = runJest('../jest-projects-with-workspace', ['--no-cache']);
    const stderr = result.stderr;
    expect(result.status).toEqual(0);
    expect(stderr).toContain('2 passed, 2 total');
  });
});

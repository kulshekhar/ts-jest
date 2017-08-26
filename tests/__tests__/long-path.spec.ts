import runJest from '../__helpers__/runJest';

describe('Long path', () => {
  it('should work as expected', () => {
    const result = runJest('../simple-long-path/', [
      '--no-cache',
      '--coverage',
    ]);
    console.log(result.stdout);
    console.log(result.stderr);

    expect(result.status).toBe(0);
  });
});

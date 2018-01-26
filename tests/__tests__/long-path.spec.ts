import runJest from '../__helpers__/runJest';

describe('Long path', () => {
  it('should work as expected', async () => {
    const result = await runJest('../simple-long-path/', [
      '--no-cache',
      '--coverage',
    ]);

    expect(result.status).toBe(0);
  });
});

import runJest from '../__helpers__/runJest';

describe('Dynamic imports', () => {
  it('should work as expected', async () => {
    const result = await runJest('../dynamic-imports', ['--no-cache']);

    expect(result.status).toBe(0);
  });

  it('should work with synthetic default imports', async () => {
    const result = await runJest('../dynamic-imports', [
      '--no-cache',
      '--config',
      'jest.allowdefaultimports.json',
    ]);

    expect(result.status).toBe(0);
  });
});

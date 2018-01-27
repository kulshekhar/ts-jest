import runJest from '../__helpers__/runJest';

describe('synthetic default imports', () => {
  it('should not work when the compiler option is false', async () => {
    const result = await runJest('../no-synthetic-default', ['--no-cache']);

    const stderr = result.stderr.toString();

    expect(result.status).toBe(1);
    expect(stderr).toContain(
      `TypeError: Cannot read property 'someExport' of undefined`,
    );
    expect(stderr).toContain('module.test.ts:6');
  });

  it('should work when the compiler option is true', async () => {
    const result = await runJest('../synthetic-default', ['--no-cache']);

    expect(result.status).toBe(0);
  });
});

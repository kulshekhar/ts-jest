import runJest from '../__helpers__/runJest';

describe('use strict', () => {
  it('should show the error locations for "use strict" violations', async () => {
    const result = await runJest('../use-strict', [
      '--no-cache',
      '-t',
      'Invalid Strict',
    ]);

    const stderr = result.stderr.toString();

    expect(result.status).toBe(1);
    expect(stderr).toContain('Strict.ts:4:4');
    expect(stderr).toContain('Strict.test.ts:7:5');
  });

  it('should work with "use strict"', async () => {
    const result = await runJest('../use-strict', [
      '--no-cache',
      '-t',
      'Strict1',
    ]);

    expect(result.status).toBe(0);
  });
});

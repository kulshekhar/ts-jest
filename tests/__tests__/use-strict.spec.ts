import runJest from '../__helpers__/runJest';

describe('use strict', () => {
  it('should show the error locations for "use strict" violations', () => {
    const result = runJest('../use-strict', [
      '--no-cache',
      '-t',
      'Invalid Strict',
    ]);

    const stderr = result.stderr;

    expect(result.status).toBe(1);
    expect(stderr).toContain('Strict.ts:4:3');
    expect(stderr).toContain('Strict.test.ts:5:5');
  });

  it('should work with "use strict"', () => {
    const result = runJest('../use-strict', ['--no-cache', '-t', 'Strict1']);

    expect(result.status).toBe(0);
  });
});

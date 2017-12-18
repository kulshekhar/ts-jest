import runJest from '../__helpers__/runJest';

describe('Typescript errors', () => {
  it('should show the correct error locations in the typescript files', () => {
    const result = runJest('../simple', ['--no-cache']);

    const stderr = result.stderr.toString();

    expect(result.status).toBe(1);
    expect(stderr).toContain('Hello.ts:18:11');
    expect(stderr).toContain('Hello.test.ts:7:19');
  });

  it('Should show the correct error locations in async typescript files', async () => {
    const result = runJest('../simple-async', ['--no-cache']);

    const stderr = result.stderr.toString();

    expect(result.status).toBe(1);
    expect(stderr).toContain('Hello.ts:13:11');
    expect(stderr).toContain('Hello.test.ts:7:5');
  });
});

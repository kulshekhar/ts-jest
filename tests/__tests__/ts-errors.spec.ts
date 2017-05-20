import runJest from '../__helpers__/runJest';

describe('hello_world', () => {

  it('should show the correct error locations in the typescript files', () => {

    const result = runJest('../simple', ['--no-cache']);

    const stderr = result.stderr.toString();

    expect(result.status).toBe(1);
    expect(stderr).toContain('Hello.ts:13:11');
    expect(stderr).toContain('Hello.test.ts:9:19');

  });

});
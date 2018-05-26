import runJest from '../__helpers__/runJest';

describe('TypeScript Diagnostics errors', () => {
  it('should show the correct error locations in the typescript files', () => {
    const result = runJest('../ts-diagnostics', ['--no-cache']);
    expect(result.stderr).toContain(
      `Hello.ts(2,10): error TS2339: Property 'push' does not exist on type`,
    );
    expect(result.stderr).toContain(
      `Hello.ts(13,10): error TS2339: Property 'unexcuted' does not exist on type 'Hello`,
    );
  });
});

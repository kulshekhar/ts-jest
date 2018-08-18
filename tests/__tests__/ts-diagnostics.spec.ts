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

  it('should only show errors for the file which matches the enableTsDiagnostics regex', () => {
    const result = runJest('../ts-diagnostics-regex', ['--no-cache']);
    expect(result.stderr).toContain(
      `__tests__/Hello-should-diagnose.ts(2,12): error TS2339: Property 'push' does not exist on type`,
    );
    expect(result.stderr).toContain(
      `__tests__/Hello-should-diagnose.ts(13,12): error TS2339: Property 'unexcuted' does not exist on type 'Hello`,
    );

    expect(result.stderr).not.toContain(`Hello-should-NOT-diagnose.ts`);
  });
});

import runJest from '../__helpers__/runJest';
import { expectJestStatus } from '../__helpers__/utils';

describe('Typescript errors', () => {
  it('should show the correct error locations in the typescript files', () => {
    const result = runJest('../no-sourcemaps', ['--no-cache']);

    const stderr = result.stderr;

    // The actual error is on line 18 - the line# being wrong here means sourcemaps are disabled.
    expect(stderr).toContain('Hello.ts:8');
    expectJestStatus(result, 1);
  });
});

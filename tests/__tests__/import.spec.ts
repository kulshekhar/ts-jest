import runJest from '../__helpers__/runJest';
import { printStdStreams } from '../../src/test-utils';

describe('import with relative and absolute paths', () => {
  it('should run successfully', () => {
    const result = runJest('../imports-test', ['--no-cache']);

    const stderr = result.stderr;

    expect(result.status).toBe(1);
    expect(stderr).toContain('4 failed, 4 total');

    expect(stderr).toContain('Hello.ts:11:11)');

    expect(stderr).toContain('Hello.test.ts:5:19)');
    expect(stderr).toContain('Hello-relative.test.ts:7:19)');

    expect(stderr).toContain('absolute-import.ts:4:17)');
    expect(stderr).toContain('absolute-import.test.ts:5:5)');

    expect(stderr).toContain('relative-import.ts:4:17)');
    expect(stderr).toContain('relative-import.test.ts:7:5)');
  });
});

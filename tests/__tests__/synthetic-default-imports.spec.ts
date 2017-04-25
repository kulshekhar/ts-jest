import { } from 'jest';
import { } from 'node';
import runJest from '../__helpers__/runJest';

describe('synthetic default imports', () => {

  it('should not work when the compiler option is false', () => {

    const result = runJest('../no-synthetic-default', ['--no-cache']);

    const stderr = result.stderr.toString();

    expect(result.status).toBe(1);
    expect(stderr).toContain(`TypeError: Cannot read property 'someExport' of undefined`);
    expect(stderr).toContain('module.test.ts:6:15');

  });

  it('should work when the compiler option is true', () => {

    const result = runJest('../synthetic-default', ['--no-cache']);

    expect(result.status).toBe(0);

  });


});

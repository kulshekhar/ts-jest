import runJest from '../__helpers__/runJest';

describe('Jest.mock() calls', () => {
  it('Should run all tests using jest.mock() underneath the imports succesfully.', async () => {
    const result = await runJest('../hoist-test', ['--no-cache']);
    const output = result.output.toString();

    expect(output).toContain('4 passed, 4 total');
    expect(result.status).toBe(0);
  });

  it('Should retain proper line endings while hoisting', async () => {
    const result = await runJest('../hoist-errors', ['--no-cache']);

    const stderr = result.stderr.toString();

    expect(result.status).toBe(1);
    expect(stderr).toContain('Hello.ts:22:11');

    // The actual error occurs at line 14. However, because the mock calls
    // are hoisted, this changes - in this case, to 22
    // The column numbers are accurate.
    expect(stderr).toContain('Hello.test.ts:22:19');
  });
});

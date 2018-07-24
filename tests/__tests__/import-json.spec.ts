import runJest from '../__helpers__/runJest';

describe('Import JSON with `resolveJsonModule`', () => {
  it('should work as expected', () => {
    const result = runJest('../import-json', ['--no-cache']);

    expect(result.status).toBe(0);
  });
});

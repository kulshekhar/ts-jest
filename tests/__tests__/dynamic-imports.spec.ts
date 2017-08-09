import runJest from '../__helpers__/runJest';

describe('Dynamic imports', () => {
  it('should work as expected', () => {
    const result = runJest('../dynamic-imports', ['--no-cache']);

    expect(result.status).toBe(0);
  });

  it('should work with synthetic default imports', () => {
    const result = runJest('../dynamic-imports', [
      '--no-cache',
      '--config',
      'jest.allowdefaultimports.json',
    ]);

    expect(result.status).toBe(0);
  });
});

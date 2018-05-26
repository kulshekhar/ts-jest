import runJest from '../__helpers__/runJest';

describe('"compiler" option', () => {
  it('should use a custom typescript compiler', () => {
    const result = runJest('../custom-ts-compiler', []);
    expect(result.status).toBe(0);
  });
});

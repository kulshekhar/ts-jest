import runJest from '../__helpers__/runJest';

describe('Dynamic imports', () => {

  it('should work as expected', () => {

    const result = runJest('../dynamic-imports', ['--no-cache']);

    expect(result.status).toBe(0);

  });

});

import runJest from '../__helpers__/runJest';

describe('ts-jest module interface', () => {
  it('should run successfully', () => {
    const result = runJest('../ts-jest-module-interface', ['--no-cache']);
    expect(result.status).toBe(0);
  });
});

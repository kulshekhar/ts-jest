import runJest from '../__helpers__/runJest';
import { expectJestStatus } from '../__helpers__/utils';

describe('ts-jest module interface', () => {
  it('should run successfully', () => {
    const result = runJest('../ts-jest-module-interface', ['--no-cache']);
    expectJestStatus(result, 0);
    // expect(result.status).toBe(0);
  });
});

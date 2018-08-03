import { runE2eTest } from '../../tests/__helpers__/jest-runner';

describe('Simple e2e test', () => {
  it('should run the tests with success', () => {
    expect('simple').toBeE2eTestWithExitCode(0);
  });
});

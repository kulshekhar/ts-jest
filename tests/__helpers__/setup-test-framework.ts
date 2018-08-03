import { runE2eTest, runTestCase } from './jest-runner';

function expectTest(runner: any, received, expectedStatus) {
  const { status, output } = runner(received);
  const pass: boolean = expectedStatus === status;
  if (pass) {
    return {
      message: () =>
        `expected e2e test ${received} to not exit with status ${expectedStatus}` +
        `\n\nOutput:\n  ${this.utils.printReceived(output)}`,
      pass: true,
    };
  } else {
    return {
      message: () =>
        `expected e2e test ${received} to exit with status ${expectedStatus}` +
        `\n\nOutput:\n  ${this.utils.printReceived(output)}`,
      pass: false,
    };
  }
}

expect.extend({
  toBeE2eTestWithExitCode(received: string, expectedStatus: number) {
    return expectTest.call(this, runE2eTest, received, expectedStatus);
  },
  toBeTestCaseWithExitCode(received: string, expectedStatus: number) {
    return expectTest.call(this, runTestCase, received, expectedStatus);
  },
});

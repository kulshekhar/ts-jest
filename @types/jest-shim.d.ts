import 'jest';

declare namespace jest {
  interface Matchers<R> {
    toBeE2eTestWithExitCode(expectedExitCode: number): R;
    toBeTestCaseWithExitCode(expectedExitCode: number): R;
  }
}

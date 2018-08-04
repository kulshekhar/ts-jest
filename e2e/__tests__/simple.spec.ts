describe('Simple e2e test', () => {
  it('should pass with babel 6', () => {
    expect('simple').toBeE2eTestWithExitCode(0);
  });
  it('should pass with babel 7', () => {
    expect('simple-babel-7').toBeE2eTestWithExitCode(0);
  });
});

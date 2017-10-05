import runJest from '../__helpers__/runJest';

describe('TSX Compilation', () => {
  it('Should compile a button succesfully', () => {
    const result = runJest('../button', ['--no-cache', '-u']);

    const stderr = result.stderr.toString();
    const output = result.output.toString();

    expect(result.status).toBe(1);
    expect(output).toContain('1 failed, 1 passed, 2 total');
    expect(stderr).toContain('Button renders correctly');
    expect(stderr).toContain('BadButton should throw an error on line 22');
  });
});

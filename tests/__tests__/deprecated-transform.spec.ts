import runJest from '../__helpers__/runJest';

describe('Deprecated Jest transform value', () => {
  it('should log the depration message', () => {
    const result = runJest('../deprecated-transform', ['--no-cache']);

    const output = result.stderr;

    // get only the line with deprecation message (we dont want the snapshot to contain any timing or test name)
    const msg = output.split('\n').find(line => /deprecated/i.test(line));

    expect(msg).toMatchSnapshot();
  });
});

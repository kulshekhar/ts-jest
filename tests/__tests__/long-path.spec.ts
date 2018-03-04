import runJest from '../__helpers__/runJest';
import * as fs from 'fs-extra';

describe('Long path', () => {
  const longPath =
    'long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/';
  beforeEach(async () => {
    // root dir is project
    await fs.remove('./tests/simple-long-path/long-src-path');
    await fs.ensureDir(`./tests/simple-long-path/${longPath}`);
    await fs.copy(
      './tests/simple-long-path/src',
      `./tests/simple-long-path/${longPath}`,
    );
  });

  it('should work as expected', () => {
    const result = runJest('../simple-long-path/', [
      '--no-cache',
      '--coverage',
    ]);

    expect(result.status).toBe(0);
  });
});

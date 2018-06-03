import runJest from '../__helpers__/runJest';
import * as fs from 'fs-extra';

describe('Long path', () => {
  const longPath =
    'long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/long-src-path' +
    '/long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/long-src-path/';
  const destinationPath = `${__dirname}/../simple-long-path/${longPath}`;
  beforeEach(async () => {
    // root dir is project
    await fs.ensureDir(destinationPath);
    await fs.copy(`${__dirname}/../simple-long-path/src`, destinationPath);
  });

  it('should work as expected', () => {
    const result = runJest('../simple-long-path/', [
      '--no-cache',
      '--coverage',
    ]);

    expect(result.status).toBe(0);
  });
});

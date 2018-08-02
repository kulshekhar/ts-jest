import * as fs from 'fs-extra';
import * as path from 'path';
import runJest from '../__helpers__/runJest';

const debugFilePath = path.resolve(
  __dirname,
  '../simple/node_modules/ts-jest/debug.txt',
);

describe('Debug output', () => {
  beforeEach(async () => {
    return fs.remove(debugFilePath);
  });

  it('should create a debug file with the correct output if the flag is set', async () => {
    runJest('../simple', ['--no-cache', '-u'], {
      TS_JEST_DEBUG: 'true',
    });
    const logFile = await fs.readFile(debugFilePath, 'utf8');

    expect(logFile).not.toBeNull();
  });

  it('Should not create a file if the debug flag is not set', async () => {
    runJest('../simple', ['--no-cache', '-u']);
    expect.assertions(1); // To make sure we actually do assert the promise on the line below
    await expect(fs.readFile(debugFilePath, 'utf8')).rejects.toThrow();
  });
});

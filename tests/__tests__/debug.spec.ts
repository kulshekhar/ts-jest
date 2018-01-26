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
    const logFile = await fs.readFile(
      path.resolve(__dirname, '../simple/node_modules/ts-jest/debug.txt'),
      'utf-8',
    );

    expect(logFile).not.toBeNull();
    expect(logFile).toMatchSnapshot(); // Ensure we have some actual output that doesn't change
  });

  it('Should not create a file if the debug flag is not set', async () => {
    runJest('../simple', ['--no-cache', '-u']);
    expect(async () => {
      await fs.readFile(
        path.resolve(__dirname, '../simple/node_modules/ts-jest/debug.txt'),
        'utf-8',
      );
    }).toThrow();
  });
});

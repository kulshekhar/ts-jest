import * as fs from 'fs';
import * as path from 'path';
import runJest from '../__helpers__/runJest';

describe('Debug output', () => {
  it('should create a debug file with the correct output if the flag is set', async () => {
    runJest('../debug', ['--no-cache', '-u']);
    const logFile = fs.readFileSync(
      path.resolve(__dirname, '../debug/node_modules/ts-jest/debug.txt'),
      'utf-8',
    );
    expect(logFile).not.toBeNull();
  });

  it('Should not create a file if the debug flag is not set', () => {
    runJest('../simple', ['--no-cache', '-u']);
    expect(() => {
      fs.readFileSync(
        path.resolve(__dirname, '../simple/node_modules/ts-jest/debug.txt'),
        'utf-8',
      );
    }).toThrow();
  });
});

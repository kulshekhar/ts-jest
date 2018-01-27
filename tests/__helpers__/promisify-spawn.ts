import { spawn as crossSpawn } from 'cross-spawn';
import { JestResult } from './runJest';

// Asynchronously spawn a process and return a promise
export async function spawnProcess(
  command: string,
  args: string[],
  options = {},
): Promise<JestResult> {
  return new Promise((resolve, reject) => {
    // default to empty strings for stdio
    let stdErr = '';
    let stdOut = '';
    let output = ''; // combined output;
    const process = crossSpawn(command, args, options);
    process.stdout.on('data', (data: Buffer) => {
      stdOut += data.toString();
      output += data.toString();
    });

    process.stderr.on('data', (data: Buffer) => {
      stdErr += data.toString();
      output += data.toString();
    });

    process.on('close', exitCode => {
      resolve({
        status: exitCode,
        stderr: stdErr,
        stdout: stdOut,
        output,
      });
    });
  }) as Promise<JestResult>;
}

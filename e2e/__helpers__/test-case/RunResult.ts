import { SpawnSyncReturns } from 'child_process'
import ProcessedFileIo from './ProcessedFileIo'
import { stripAnsiColors, normalizeJestOutput } from './utils'

// tslint:disable-next-line:no-default-export
export default class RunResult {
  constructor(
    readonly cwd: string,
    readonly result: SpawnSyncReturns<Buffer>,
    readonly context: Readonly<{
      ioDir?: string | undefined,
      cmd: string,
      args: string[],
      env: { [key: string]: string },
    }>,
  ) { }
  get isPass() { return this.status === 0 }
  get isFail() { return !this.isPass }
  get status() { return this.result.status }
  get output() { return stripAnsiColors((this.result.output ? this.result.output.join('\n\n') : '')) }
  get stderr() { return stripAnsiColors((this.result.stderr || '').toString()) }
  get normalizedStderr() { return normalizeJestOutput(this.stderr) }
  get stdout() { return stripAnsiColors((this.result.stdout || '').toString()) }
  get normalizedStdout() { return normalizeJestOutput(this.stdout) }
  get cmdLine() {
    return [this.context.cmd, ...this.context.args].join(' ')
  }
  ioFor(relFilePath: string): ProcessedFileIo {
    if (!this.context.ioDir) {
      throw new Error('IO not written for test, you must configure the test with `writeIo: true`.')
    }
    const io = require(`${this.context.ioDir}/${relFilePath}.json`)
    return new ProcessedFileIo(this.cwd, relFilePath, io.in, io.out)
  }
}

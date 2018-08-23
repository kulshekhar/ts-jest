import { SpawnSyncReturns } from 'child_process'
import ProcessedFileIo from './ProcessedFileIo'
import { stripAnsiColors, normalizeJestOutput, escapeRegex } from './utils'
import { resolve } from 'path'
import { readFileSync, realpathSync } from 'fs'
import { LOG_PREFIX } from '../../../src/util/debug'
import { tmpdir } from 'os'

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
  get logFilePath() { return resolve(this.cwd, 'ts-jest-debug.log') }
  get logFileContent() { return readFileSync(this.logFilePath).toString('utf8') }
  get normalizedLogFileContent() {
    const prefix = ` ${LOG_PREFIX} `
    return this.normalize(this.logFileContent.split(/\n/g).map(s => {
      return s.split(prefix).slice(1).join(prefix)
    }).join('\n'))
  }
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

  normalize(str: string) {
    // TODO: hmmm clean this!
    return [
      { from: this.cwd, to: '<cwd>' },
      { from: realpathSync(this.cwd), to: '<cwd>' },
      { from: tmpdir(), to: '<tmp>' },
      { from: realpathSync(tmpdir()), to: '<tmp>' },
      { from: /\b[a-f0-9]{40}\b/g, to: '<hex:40>' },
    ]
      .sort((a, b) => ((b.from as any).length || 0) - ((a.from as any).length || 0))
      .reduce((str, { from, to }) => {
        return str.replace(typeof from === 'string' ? new RegExp(`${escapeRegex(from)}`, 'g') : from, to)
      }, str)
  }
}

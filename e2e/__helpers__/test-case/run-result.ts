import { Config } from '@jest/types'
import { LogMessage } from 'bs-logger'
import { SpawnSyncReturns } from 'child_process'
import { readFileSync, realpathSync } from 'fs'
import { tmpdir } from 'os'
import { resolve, sep } from 'path'

import { cacheDir } from '../../../scripts/lib/paths'

import ProcessedFileIo from './processed-file-io'
import { escapeRegex, normalizeJestOutput, stripAnsiColors } from './utils'

export default class RunResult {
  constructor(
    readonly cwd: string,
    readonly result: SpawnSyncReturns<Buffer>,
    readonly context: Readonly<{
      ioDir?: string | undefined
      cmd: string
      args: string[]
      env: { [key: string]: string }
      config: Config.InitialOptions
      digest: string
    }>,
  ) {}

  get logFilePath(): string {
    return resolve(this.cwd, 'ts-jest.log')
  }

  get logFileContent(): string {
    return readFileSync(this.logFilePath).toString('utf8')
  }

  get logFileEntries(): LogMessage[] {
    const lines = this.logFileContent.split(/\n/g)
    // remove last, empty line
    lines.pop()

    return lines.map(s => JSON.parse(s))
  }

  get isPass(): boolean {
    return this.status === 0
  }

  get isFail(): boolean {
    return !this.isPass
  }

  get status(): number | null {
    return this.result.status
  }

  get output(): string {
    return this.normalize(stripAnsiColors(this.result.output ? this.result.output.join('\n\n') : ''))
  }

  get stderr(): string {
    return this.normalize(stripAnsiColors((this.result.stderr || '').toString()))
  }

  get normalizedStderr(): string {
    return normalizeJestOutput(this.stderr)
  }

  get stdout(): string {
    return this.normalize(stripAnsiColors((this.result.stdout || '').toString()))
  }

  get normalizedStdout(): string {
    return normalizeJestOutput(this.stdout)
  }

  get cmdLine(): string {
    const args = [this.context.cmd, ...this.context.args].filter(
      a => !['-u', '--updateSnapshot', '--runInBand', '--'].includes(a),
    )
    const configIndex = args.indexOf('--config')
    if (configIndex !== -1) {
      args.splice(configIndex, 2)
    }

    return this.normalize(args.join(' '))
  }

  ioFor(relFilePath: string): ProcessedFileIo {
    if (!this.context.ioDir) {
      throw new Error('IO not written for test, you must configure the test with `writeIo: true`.')
    }
    let io: any = { in: ['', '', {}, {}], out: '' }
    try {
      io = require(`${this.context.ioDir}/${relFilePath}.json`)
    } catch (err) {
      io.out = `/*\nts-jest after hook has not been called!\n${err}\noutput:\n${this.output}*/`
    }

    return new ProcessedFileIo(this.cwd, relFilePath, io.in, io.out)
  }

  normalize(str: string): string {
    // TODO: clean this!
    const cwd = this.cwd
    const realCwd = realpathSync(cwd)
    const tmp = tmpdir()
    const realTmp = realpathSync(tmp)
    const map = [
      { from: cwd, to: '<cwd>' },
      { from: tmp, to: '<tmp>' },
      { from: /\b[a-f0-9]{40}\b/g, to: '<hex:40>' },
      { from: cacheDir, to: '<ts-jest-cache>' },
    ]
    if (cwd !== realCwd) map.push({ from: realCwd, to: '<cwd>' })
    if (tmp !== realTmp) map.push({ from: realTmp, to: '<tmp>' })
    if (sep === '\\') {
      map.push({ from: /\\/g, to: '/' })
      map.push({ from: cwd.replace(/\\/g, '/'), to: '<cwd>' })
      map.push({ from: tmp.replace(/\\/g, '/'), to: '<tmp>' })
      if (cwd !== realCwd) {
        map.push({ from: realCwd.replace(/\\/g, '/'), to: '<cwd>' })
      }
      if (tmp !== realTmp) {
        map.push({ from: realTmp.replace(/\\/g, '/'), to: '<tmp>' })
      }
    }

    return map
      .sort((a, b) => ((b.from as any).length || Infinity) - ((a.from as any).length || Infinity))
      .reduce((str, { from, to }) => str.replace(typeof from === 'string' ? new RegExp(`${escapeRegex(from)}`, 'g') : from, to), str)
  }
}

import { sync as spawnSync } from 'cross-spawn'
import {
  copySync,
  ensureSymlinkSync,
  existsSync,
  mkdirpSync,
  outputFileSync,
  outputJsonSync,
  readFileSync,
  readJsonSync,
  readdirSync,
  realpathSync,
  removeSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'fs-extra'
import merge from 'lodash.merge'
import { join, relative, sep } from 'path'

import * as Paths from '../../../scripts/lib/paths'

import RunResult from './run-result'
import { PreparedTest, RunTestOptions } from './types'
import { templateNameForPath } from './utils'

const TEMPLATE_EXCLUDED_ITEMS = ['node_modules', 'package-lock.json']

const EVAL_SOURCE = `
describe.skip('__eval', () => {
  test.skip('__test', () => {
    expect(true).toBe(true);
  });
  it.skip('__test', () => {
    expect(true).toBe(true);
  });
});

eval(process.__TS_JEST_EVAL);
`

// tslint:disable-next-line:variable-name
let __hooksSource: string
function hooksSourceWith(vars: Record<string, any>): string {
  if (!__hooksSource) {
    __hooksSource = readFileSync(join(__dirname, '__hooks-source__.js.hbs'), 'utf8')
  }
  return __hooksSource.replace(/\{\{([^\}]+)\}\}/g, (_, key) => JSON.stringify(vars[key]))
}

export function run(name: string, options: RunTestOptions = {}): RunResult {
  const { args = [], env = {}, template, inject, writeIo } = options
  const { workdir: dir, sourceDir, hooksFile, ioDir } = prepareTest(
    name,
    template || templateNameForPath(join(Paths.e2eSourceDir, name)),
    options,
  )
  const pkg = require(join(dir, 'package.json'))

  let shortCmd: string
  let cmdArgs: string[] = []
  if (inject) {
    cmdArgs.push('--testPathPattern="/__eval\\\\.ts$"')
  } // '--testRegex=""'
  if (process.argv.find(v => ['--updateSnapshot', '-u'].includes(v))) {
    cmdArgs.push('-u')
  }
  cmdArgs.push(...args)
  if (!inject && pkg.scripts && pkg.scripts.test) {
    if (cmdArgs.length) {
      cmdArgs.unshift('--')
    }
    cmdArgs = ['npm', '-s', 'run', 'test', ...cmdArgs]
    shortCmd = 'npm'
  } else {
    cmdArgs.unshift(join(dir, 'node_modules', '.bin', 'jest'))
    shortCmd = 'jest'
  }

  // merge given config extend
  if (options.jestConfig || options.tsJestConfig) {
    let originalConfig: any = join(dir, 'jest.config.js')
    if (existsSync(originalConfig)) {
      originalConfig = require(originalConfig)
    } else {
      originalConfig = require(join(dir, 'package.json')).jest || {}
    }
    cmdArgs.push(
      '--config',
      JSON.stringify(
        merge({}, originalConfig, options.jestConfig, {
          globals: { 'ts-jest': options.tsJestConfig || {} },
        }),
      ),
    )
  }

  // run in band
  if (!cmdArgs.includes('--runInBand')) {
    cmdArgs.push('--runInBand')
  }

  const cmd = cmdArgs.shift() as string

  // Add both process.env which is the standard and custom env variables
  const mergedEnv: any = {
    ...process.env,
    ...env,
  }
  if (inject) {
    const injected = typeof inject === 'function' ? `(${inject.toString()}).apply(this);` : inject
    mergedEnv.__TS_JEST_EVAL = injected
  }
  if (writeIo) {
    mergedEnv.TS_JEST_HOOKS = hooksFile
  }

  const result = spawnSync(cmd, cmdArgs, {
    cwd: dir,
    env: mergedEnv,
  })

  // we need to copy each snapshot which does NOT exists in the source dir
  readdirSync(dir).forEach(item => {
    if (item === 'node_modules' || !statSync(join(dir, item)).isDirectory()) {
      return
    }
    const srcDir = join(sourceDir, item)
    const wrkDir = join(dir, item)
    copySync(wrkDir, srcDir, {
      overwrite: false,
      filter: from => {
        return relative(sourceDir, from)
          .split(sep)
          .includes('__snapshots__')
      },
    })
  })

  return new RunResult(realpathSync(dir), result, {
    cmd: shortCmd,
    args: cmdArgs,
    env: mergedEnv,
    ioDir: writeIo ? ioDir : undefined,
  })
}

export function prepareTest(name: string, template: string, options: RunTestOptions = {}): PreparedTest {
  const sourceDir = join(Paths.e2eSourceDir, name)
  // working directory is in the temp directory, different for each template name
  const caseWorkdir = join(Paths.e2eWorkDir, template, name)
  const templateDir = join(Paths.e2eWorkTemplatesDir, template)
  // config utils
  const configUtils = {
    merge: (...objects: any[]) => merge({}, ...objects),
  }

  // recreate the directory
  removeSync(caseWorkdir)
  mkdirpSync(caseWorkdir)

  const tmplModulesDir = join(templateDir, 'node_modules')
  const caseModulesDir = join(caseWorkdir, 'node_modules')

  // link the node_modules dir if the template has one
  if (existsSync(tmplModulesDir)) {
    symlinkSync(tmplModulesDir, caseModulesDir)
  }

  // copy files from the template to the case dir
  readdirSync(templateDir).forEach(item => {
    if (TEMPLATE_EXCLUDED_ITEMS.includes(item)) {
      return
    }
    copySync(join(templateDir, item), join(caseWorkdir, item))
  })

  // copy source and test files
  const snapshotDirs: Record<string, 0> = Object.create(null)
  copySync(sourceDir, caseWorkdir, {
    filter: (src, dest) => {
      const relPath = relative(sourceDir, src)
      const segments = relPath.split(sep)
      if (segments.includes('__snapshots__')) {
        // link snapshots
        while (segments[segments.length - 1] !== '__snapshots__') {
          segments.pop()
        }
        snapshotDirs[segments.join(sep)] = 0
        return false
      } else if (relPath === 'jest.config.js') {
        // extend base if it's a function
        let baseConfig = {}
        if (existsSync(dest)) {
          baseConfig = require(dest)
        }
        const mod = require(src)
        if (typeof mod === 'function') {
          writeFileSync(dest, `module.exports = ${JSON.stringify(mod(baseConfig, configUtils))}`)
          return false
        }
        return true
      } else {
        return true
      }
    },
  })
  // create symbolic links for the existing snapshots
  Object.keys(snapshotDirs).forEach(dir => {
    ensureSymlinkSync(join(sourceDir, dir), join(caseWorkdir, dir))
  })

  // create the special files
  outputFileSync(join(caseWorkdir, '__eval.ts'), EVAL_SOURCE, 'utf8')
  let ioDir!: string
  if (options.writeIo) {
    ioDir = join(caseWorkdir, '__io__')
    mkdirpSync(ioDir)
  }
  const hooksFile = join(caseWorkdir, '__hooks.js')
  outputFileSync(
    hooksFile,
    hooksSourceWith({
      writeProcessIoTo: ioDir || false,
    }),
    'utf8',
  )

  // create a package.json if it does not exists, and/or enforce the package name
  const pkgFile = join(caseWorkdir, 'package.json')
  const pkg: any = existsSync(pkgFile) ? readJsonSync(pkgFile) : {}
  pkg.name = name
  pkg.private = true
  pkg.version = `0.0.0-mock0`
  outputJsonSync(pkgFile, pkg, { spaces: 2 })

  return { workdir: caseWorkdir, templateDir, sourceDir, hooksFile, ioDir }
}

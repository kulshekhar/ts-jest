import { Config } from '@jest/types'
import { sync as spawnSync } from 'cross-spawn'
import { createHash } from 'crypto'
import stringifyJson = require('fast-json-stable-stringify')
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
  renameSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'fs-extra'
import { stringify as stringifyJson5 } from 'json5'
import merge = require('lodash.merge')
import { join, relative, resolve, sep } from 'path'

import * as Paths from '../../../scripts/lib/paths'

import RunResult from './run-result'
import { PreparedTest, RunTestOptions } from './types'
import { enableOptimizations, templateNameForPath } from './utils'

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

eval(process.env.__TS_JEST_EVAL);
`

let __hooksSource: string
function hooksSourceWith(vars: Record<string, any>): string {
  if (!__hooksSource) {
    __hooksSource = readFileSync(join(__dirname, '__hooks-source__.js.hbs'), 'utf8')
  }

  // eslint-disable-next-line no-useless-escape
  return __hooksSource.replace(/\{\{([^\}]+)\}\}/g, (_, key) => JSON.stringify(vars[key]))
}

export function run(name: string, options: RunTestOptions = {}): RunResult {
  const { env = {}, template, inject, writeIo, noCache, jestConfigPath: configFile = 'jest.config.js' } = options
  const { workdir: dir, sourceDir } = prepareTest(
    name,
    template || templateNameForPath(join(Paths.e2eSourceDir, name)),
    options,
  )
  const pkg = readJsonSync(join(dir, 'package.json'))

  const jestConfigPath = (path: string = dir) => resolve(path, configFile)

  // grab base configuration
  let baseConfig: Config.InitialOptions = require(jestConfigPath())
  if (configFile === 'package.json') baseConfig = (baseConfig as any).jest

  const extraConfig = {} as Config.InitialOptions

  let shortCmd: string
  let cmdArgs: string[] = []
  if (inject) {
    extraConfig.testMatch = undefined
    extraConfig.testRegex = '/__eval\\.ts$'
  }
  if (process.argv.find(v => ['--updateSnapshot', '-u'].includes(v))) {
    cmdArgs.push('-u')
  }
  if (!inject && pkg.scripts && pkg.scripts.test) {
    cmdArgs = ['npm', '-s', 'run', 'test', '--', ...cmdArgs]
    shortCmd = 'npm'
  } else {
    cmdArgs.unshift(join('node_modules', '.bin', 'jest'))
    shortCmd = 'jest'
  }

  // extends config
  if (options.jestConfig) {
    merge(extraConfig, options.jestConfig)
  }
  if (options.tsJestConfig) {
    const globalConfig: any = extraConfig.globals || (extraConfig.globals = {'ts-jest': {}})
    const tsJestConfig = globalConfig['ts-jest'] || (globalConfig['ts-jest'] = {})
    merge(tsJestConfig, options.tsJestConfig)
  }

  // cache dir
  if (noCache || writeIo) {
    cmdArgs.push('--no-cache')
    extraConfig.cacheDirectory = undefined
  } else if (!(baseConfig.cacheDirectory || extraConfig.cacheDirectory)) {
    // force the cache directory if not set
    extraConfig.cacheDirectory = join(Paths.cacheDir, `e2e-${template}`)
  }

  // build final config and create dir suffix based on it
  const finalConfig = merge({}, baseConfig, extraConfig)
  const digest = createHash('sha1')
    .update(stringifyJson(finalConfig))
    .digest('hex')
  // this must be in the same path hierarchy as dir
  const nextDirPrefix = `${dir}-${digest.substr(0, 7)}.`
  let index = 1
  while (existsSync(`${nextDirPrefix}${index}`)) index++
  const nextDir = `${nextDirPrefix}${index}`

  // move the directory related to config digest
  renameSync(dir, nextDir)

  // write final config
  // FIXME: sounds like the json fail to be encoded as an arg
  // eslint-disable-next-line no-constant-condition
  if (false /* enableOptimizations() */) {
    cmdArgs.push('--config', JSON.stringify(finalConfig))
  } else if (Object.keys(extraConfig).length !== 0) {
    if (configFile === 'package.json') {
      pkg.jest = finalConfig
      outputJsonSync(jestConfigPath(nextDir), pkg)
    } else {
      outputFileSync(jestConfigPath(nextDir), `module.exports = ${JSON.stringify(finalConfig, null, 2)}`, 'utf8')
    }
  }

  // ensure we run in band
  if (!cmdArgs.includes('--runInBand')) {
    cmdArgs.push('--runInBand')
  }

  const cmd = cmdArgs.shift() as string
  if (cmdArgs[cmdArgs.length - 1] === '--') cmdArgs.pop()

  // extend env
  const localEnv: any = { ...env }
  if (inject) {
    const injected = typeof inject === 'function' ? `(${inject.toString()}).apply(this);` : inject
    localEnv.__TS_JEST_EVAL = injected
  }
  if (writeIo) {
    localEnv.TS_JEST_HOOKS = defaultHooksFile('.')
  }

  // arguments to give to spawn
  const spawnOptions: { env: Record<string, string>; cwd: string } = { env: localEnv } as any

  // create started script for debugging
  if (!enableOptimizations()) {
    outputFileSync(
      join(nextDir, '__launch.js'),
      `
const { execFile } = require('child_process')
const cmd = ${stringifyJson5(cmd, null, 2)}
const args = ${stringifyJson5(cmdArgs, null, 2)}
const options = ${stringifyJson5(spawnOptions, null, 2)}
options.env = Object.assign({}, process.env, options.env)
execFile(cmd, args, options)
`,
      'utf8',
    )
  }

  // extend env with our env
  spawnOptions.env = { ...process.env, ...localEnv }
  spawnOptions.cwd = nextDir

  // run jest
  const result = spawnSync(cmd, cmdArgs, spawnOptions)

  // we need to copy each snapshot which does NOT exists in the source dir
  if (!enableOptimizations()) {
    readdirSync(nextDir).forEach(item => {
      if (item === 'node_modules' || !statSync(join(nextDir, item)).isDirectory()) {
        return
      }
      const srcDir = join(sourceDir, item)
      const wrkDir = join(nextDir, item)

      // do not try to copy a linked root snapshots
      if (item === '__snapshots__' && existsSync(srcDir)) return

      copySync(wrkDir, srcDir, {
        overwrite: false,
        filter: from => relative(sourceDir, from)
            .split(sep)
            .includes('__snapshots__'),
      })
    })
  }

  return new RunResult(realpathSync(nextDir), result, {
    cmd: shortCmd,
    args: cmdArgs,
    env: localEnv,
    ioDir: writeIo ? ioDirForPath(nextDir) : undefined,
    config: finalConfig,
    digest,
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
    // It's important to mark this symlink as 'dir' or tests fail
    // with permission issues on windows.
    symlinkSync(tmplModulesDir, caseModulesDir, 'dir')
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
  // hooks
  if (options.writeIo) {
    ioDir = ioDirForPath(caseWorkdir)
    mkdirpSync(ioDir)
    const hooksFile = defaultHooksFile(caseWorkdir)
    outputFileSync(
      hooksFile,
      hooksSourceWith({
        writeProcessIoTo: ioDirForPath('.') || false,
      }),
      'utf8',
    )
  }

  // create a package.json if it does not exists, and/or enforce the package name
  const pkgFile = join(caseWorkdir, 'package.json')
  const pkg: any = existsSync(pkgFile) ? readJsonSync(pkgFile) : {}
  pkg.name = name
  pkg.private = true
  pkg.version = `0.0.0-mock0`
  outputJsonSync(pkgFile, pkg, { spaces: 2 })

  return { workdir: caseWorkdir, templateDir, sourceDir }
}

function ioDirForPath(path: string) {
  return join(path, '__io__')
}

function defaultHooksFile(path: string) {
  return join(path, '__hooks.js')
}

import { existsSync } from 'fs-extra'
import { join } from 'path'

// from https://stackoverflow.com/questions/25245716/remove-all-ansi-colors-styles-from-strings
export function stripAnsiColors(stringToStrip: string): string {
  // eslint-disable-next-line no-control-regex
  return stringToStrip.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
}

export function templateNameForPath(path: string): string {
  const e2eFile = join(path, '.ts-jest-e2e.json')
  if (existsSync(e2eFile)) {
    return require(e2eFile).template || 'default'
  }

  return 'default'
}

// first one of each must be the most compatible one
const PASS_MARKS = ['√', '✓']
const FAIL_MARKS = ['×', '✕']
const normalizeTestMark = (mark: string): string => {
  if (PASS_MARKS.includes(mark)) return PASS_MARKS[0]
  if (FAIL_MARKS.includes(mark)) return FAIL_MARKS[0]

  return '?'
}

export function normalizeJestOutput(output: string): string {
  let out: string = output
    .trim()
    // removes total and estimated times
    .replace(/^(\s*Time\s*:\s*)[\d.]+ m?s(?:(,\s*estimated\s+)[\d.]+ m?s)?$/gm, (_, start) => `${start}XXs`)
    // remove times after PASS/FAIL path/to/file (xxxs)
    .replace(/^\s*((?:PASS|FAIL) .+) \([\d.]+m?s\)$/gm, (_, start) => `${start}`)
    // removes each test time values
    .replace(
      // eslint-disable-next-line no-useless-escape
      /^(\s*)(✕|×|✓|√)(\s+[^\(]+)(\s+\([\d.]+ m?s\))?$/gm,
      (_, start, mark, mid /* , time */) => `${start}${normalizeTestMark(mark)}${mid}`,
    )
  // TODO: improves this...
  if (process.platform === 'win32') {
    out = out.replace(/\\/g, '/')
  }

  return out
}

export function escapeRegex(s: string): string {
  // eslint-disable-next-line no-useless-escape
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}

export function enableOptimizations(): boolean {
  return !!process.env.TS_JEST_E2E_OPTIMIZATIONS
}

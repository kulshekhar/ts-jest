import {
  TestRunResult,
  sanitizeOutput,
} from '../__helpers__/test-case'

export const test = (val: any) => val && val instanceof TestRunResult
export const print = (val: TestRunResult, serialize: any, indent: any) => {
  const out = [
    `${val.status === 0 ? '√' : '×'} ${val.cmdLine}`,
    `↳ exit code: ${val.status}`,
    `===[ STDOUT ]${'='.repeat(67)}`,
    sanitizeOutput(val.stdout),
    `===[ STDERR ]${'='.repeat(67)}`,
    sanitizeOutput(val.stderr),
    '='.repeat(80),
  ]
    .map(l => indent(l))
    .join('\n')
  return out
}

import RunResult from '../__helpers__/test-case/run-result'

export const test = (val: any) => val && val instanceof RunResult
export const print = (val: RunResult, _: any, indent: any) => {
  const out = [
    `${val.status === 0 ? '√' : '×'} ${val.cmdLine}`,
    `↳ exit code: ${val.status}`,
    `===[ STDOUT ]${'='.repeat(67)}`,
    val.normalizedStdout,
    `===[ STDERR ]${'='.repeat(67)}`,
    val.normalizedStderr,
    '='.repeat(80),
  ]
    .map(l => indent(l))
    .join('\n')
  return out
}

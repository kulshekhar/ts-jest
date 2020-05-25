import RunResult from '../__helpers__/test-case/run-result'

export const test = (val: unknown): boolean => val && val instanceof RunResult
export const print = (val: RunResult, _: unknown, indent: (l: string) => unknown): string => [
    `${ val.status === 0 ? '√' : '×' } ${ val.cmdLine }`,
    `↳ exit code: ${ val.status }`, // eslint-disable-line @typescript-eslint/restrict-template-expressions
    `===[ STDOUT ]${ '='.repeat(67) }`,
    val.normalizedStdout,
    `===[ STDERR ]${ '='.repeat(67) }`,
    val.normalizedStderr,
    '='.repeat(80),
  ]
    .map(l => indent(l))
    .join('\n')

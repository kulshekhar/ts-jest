import { RunTestOptions } from './types'
import RunDescriptor from './run-descriptor'

export function configureTestCase(
  name: string,
  options: RunTestOptions = {},
): RunDescriptor {
  return new RunDescriptor(name, options)
}

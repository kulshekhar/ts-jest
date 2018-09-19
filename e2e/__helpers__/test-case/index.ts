import RunDescriptor from './run-descriptor'
import { RunTestOptions } from './types'

export function configureTestCase(name: string, options: RunTestOptions = {}): RunDescriptor {
  return new RunDescriptor(name, options)
}

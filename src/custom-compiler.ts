// Only for types; take care never to use ts_types in expressions, only in type annotations
import * as ts_types from 'typescript';
import { wrapError } from './utils/wrap-error';
import { TsJestConfig } from './types';

/**
 * Return a typescript compiler.
 * Allows config to specify alternative compiler.
 * For example, `ntypescript`.
 */
export function getTypescriptCompiler(config: TsJestConfig): typeof ts_types {
  const compilerName = typeof config.compiler === 'string' ? config.compiler : 'typescript';
  try {
    return require(compilerName);
  } catch (err) {
    throw wrapError(err, new Error('Could not import typescript compiler "' + compilerName + '"'));
  }
}

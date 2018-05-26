// Only for types; take care never to use ts_types in expressions, only in type annotations
import * as ts_types from 'typescript';
import { TsJestConfig } from './jest-types';

/**
 * Return a typescript compiler.
 * Allows config to specify alternative compiler.
 * For example, `ntypescript`.
 */
export function getTypescriptCompiler(config: TsJestConfig): typeof ts_types {
  if (typeof config.compiler === 'string') {
    return require(config.compiler);
  } else {
    return require('typescript');
  }
}

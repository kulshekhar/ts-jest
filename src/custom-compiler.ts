import * as __typeof__ts from 'typescript';
import { TsJestConfig } from './jest-types';

/**
 * Return a typescript compiler.
 * Allows config to specify alternative compiler.
 * For example, `ntypescript`.
 */
export function getTypescriptCompiler(config: TsJestConfig): typeof __typeof__ts {
  if (typeof config.compiler === 'string') {
    return require(config.compiler);
  } else {
    return require('typescript');
  }
}

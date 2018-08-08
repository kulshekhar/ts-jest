import * as _babelJest from 'babel-jest';
import { CompilerOptions } from 'typescript';
import TsProgram from './ts-program';

export type TBabelJest = typeof _babelJest;

export interface TsJestGlobalOptions {
  // either a file to the ts config or compiler options
  tsConfig?: string | CompilerOptions;
  // whether to use babel jest under the hood or not
  useBabelJest?: boolean;
}

export interface TsJestInstance {
  tsConfig: CompilerOptions;
  useBabelJest: boolean;
  shouldWrapHtml: boolean;
  tsProgram: TsProgram;
}

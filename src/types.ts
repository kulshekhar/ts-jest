import * as _babelJest from 'babel-jest';
import { CompilerOptions, Node } from 'typescript';
import TransformationManager from './transformers/manager';

export type TBabelJest = typeof _babelJest;

// CAUTION: use same key-value pair allow us to not store a list of values somewhere
export enum DiagnosticTypes {
  syntactic = 'syntactic',
  options = 'options',
  global = 'global',
  semantic = 'sementic',
}
export enum DiagnosticSets {
  none = 'none',
  full = 'full',
  default = 'default',
}
export const diagnosticSets = {
  full: [
    DiagnosticTypes.global,
    DiagnosticTypes.syntactic,
    DiagnosticTypes.semantic,
    DiagnosticTypes.options,
  ],
  default: [DiagnosticTypes.syntactic, DiagnosticTypes.options],
  none: [],
};

export interface TsJestGlobalOptions {
  // either a file to the ts config or compiler options
  tsConfig?: string | CompilerOptions;
  // what kind of diagnostics to report
  diagnostics?: DiagnosticTypes[] | DiagnosticTypes | DiagnosticSets | boolean;
  // whether to use babel jest under the hood or not
  useBabelJest?: boolean;
}

export interface TsJestConfig {
  inputOptions: TsJestGlobalOptions;
  useBabelJest: boolean;
  diagnostics: DiagnosticTypes[];
}

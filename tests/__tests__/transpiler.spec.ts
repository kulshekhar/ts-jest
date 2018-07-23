import { transpileTypescript } from '../../dist/transpiler';
import * as ts from 'typescript';

describe('transpileTypescript', () => {
  const compilerOptions: ts.CompilerOptions = {
    newLine: ts.NewLineKind.LineFeed,
  };

  it('should transpile valid TS syntax', () => {
    const result = transpileTypescript(
      'valid.ts',
      'var a = true;',
      compilerOptions,
    );
    expect(result.code).toBe('var a = true;\n');
  });

  it('should transpile valid TS syntax with type errors', () => {
    const result = transpileTypescript(
      'valid.ts',
      'var a: string = true;',
      compilerOptions,
    );
    expect(result.code).toBe('var a = true;\n');
  });

  it('should throw an error when transpiling invalid TS syntax', () => {
    expect(() => {
      transpileTypescript('invalid.ts', 'var a = ;', compilerOptions);
    }).toThrow(
      'TypeScript compiler encountered syntax errors while transpiling. Errors: Expression expected.',
    );
  });
});

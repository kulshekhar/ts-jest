import formatTsDiagnostics from './format-diagnostics';
import {
  getPreEmitDiagnostics,
  createProgram,
  CompilerOptions,
} from 'typescript';

export default function runTsDiagnostics(
  filePath: string,
  compilerOptions: CompilerOptions,
): void {
  const program = createProgram([filePath], compilerOptions);
  const allDiagnostics = getPreEmitDiagnostics(program);

  if (allDiagnostics.length) {
    throw new Error(formatTsDiagnostics(allDiagnostics));
  }
}

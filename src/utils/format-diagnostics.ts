import {
  sys,
  Diagnostic,
  FormatDiagnosticsHost,
  formatDiagnostics,
} from 'typescript';

export default function formatTsDiagnostics(errors: Diagnostic[]): string {
  const defaultFormatHost: FormatDiagnosticsHost = {
    getCurrentDirectory: () => sys.getCurrentDirectory(),
    getCanonicalFileName: fileName => fileName,
    getNewLine: () => sys.newLine,
  };

  return formatDiagnostics(errors, defaultFormatHost);
}

import ts, {
  SourceFile,
  Bundle,
  Node,
  Diagnostic,
  CompilerOptions,
} from 'typescript';

// typescript internals
// TODO: should we copy/paste their source since it's internal?
export const getNodeId: (node: Node) => any = (ts as any).getNodeId;
export const fixupCompilerOptions: (
  options: CompilerOptions,
  diagnostics: Diagnostic[],
) => CompilerOptions = (ts as any).fixupCompilerOptions;
export const chainBundle: (
  transformSourceFile: (x: SourceFile) => SourceFile,
) => (x: SourceFile | Bundle) => SourceFile | Bundle = (ts as any).chainBundle;
export const getOriginalNodeId: (node: Node) => number = (ts as any)
  .getOriginalNodeId;

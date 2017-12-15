import { getTSConfig, mockGlobalTSConfigSchema } from './utils';
import { Compiler } from './compiler/compiler';

export function transpileIfTypescript(path, contents, config?) {
  if (path && (path.endsWith('.tsx') || path.endsWith('.ts'))) {
    const options = getTSConfig(
      config || mockGlobalTSConfigSchema(global),
      true,
    );
    const compiler = new Compiler(options);
    return compiler.emitFile({ path, src: contents }).text;
  }
  return contents;
}

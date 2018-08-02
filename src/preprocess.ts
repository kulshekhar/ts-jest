import { flushLogs, logOnce } from './utils/logger';
import { postProcessCode } from './postprocess';
import { transpileTypescript } from './transpiler';
import runTsDiagnostics from './utils/run-ts-diagnostics';
import getTSConfig from './utils/get-ts-config';
import getTSJestConfig from './utils/get-ts-jest-config';

export default function preprocess(
  src: string,
  filePath: jest.Path,
  jestConfig: jest.ProjectConfig,
  transformOptions?: jest.TransformOptions,
): jest.TransformedSource | string {
  // transformOptions.instrument is a proxy for collectCoverage
  // https://github.com/kulshekhar/ts-jest/issues/201#issuecomment-300572902
  const compilerOptions = getTSConfig(jestConfig);

  logOnce('final compilerOptions:', compilerOptions);

  const isTsFile = /\.tsx?$/.test(filePath);
  const isJsFile = /\.jsx?$/.test(filePath);
  const isHtmlFile = /\.html$/.test(filePath);

  // This is to support angular 2. See https://github.com/kulshekhar/ts-jest/pull/145
  if (
    isHtmlFile &&
    jestConfig.globals &&
    (jestConfig.globals as any).__TRANSFORM_HTML__
  ) {
    src = 'module.exports=' + JSON.stringify(src) + ';';
  }

  const processFile =
    compilerOptions.allowJs === true ? isTsFile || isJsFile : isTsFile;

  if (!processFile) {
    return src;
  }

  const tsJestConfig = getTSJestConfig(jestConfig);
  logOnce('tsJestConfig: ', tsJestConfig);

  // We can potentially do this faster by using the language service.
  // See https://github.com/TypeStrong/ts-node/blob/master/src/index.ts#L268
  if (tsJestConfig.enableTsDiagnostics) {
    runTsDiagnostics(filePath, compilerOptions);
  }

  const transpileOutput = transpileTypescript(filePath, src, compilerOptions);

  // FIXME: this should be done in the typescript source, else it's invalidating source maps
  if (tsJestConfig.ignoreCoverageForAllDecorators === true) {
    transpileOutput.code = transpileOutput.code.replace(
      /\b__decorate\b/g,
      '/* istanbul ignore next */__decorate',
    );
  }
  if (tsJestConfig.ignoreCoverageForDecorators === true) {
    transpileOutput.code = transpileOutput.code.replace(
      /(\b__decorate\(\[\r?\n[^\n\r]*)\/\*\s*istanbul\s+ignore\s+decorator(.*)\*\//g,
      '/* istanbul ignore next$2*/$1',
    );
  }

  const outputText = postProcessCode(
    jestConfig,
    transformOptions,
    transpileOutput,
    filePath,
  );

  flushLogs();

  return { code: outputText.code, map: outputText.map };
}

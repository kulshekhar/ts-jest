import * as crypto from 'crypto';
import * as tsc from 'typescript';
import { JestConfig, Path, TransformOptions } from './jest-types';
import { flushLogs, logOnce } from './logger';
import { getPostProcessHook } from './postprocess';
import * as ts from 'typescript';
import {
  cacheFile,
  getTSConfig,
  getTSJestConfig,
  runTsDiagnostics,
  injectSourcemapHook,
} from './utils';
import { cwd } from 'process';
import * as fs from 'fs';
import { outputFile } from 'fs-extra';
// tslint:disable

const shouldDebug = false;
const debugFn = shouldDebug
  ? <T, U>(key: string, fn: (arg: T) => U) => {
      return (x: T) => {
        // tslint:disable-next-line
        console.log(key, x);
        const res = fn(x);
        // tslint:disable-next-line
        // console.log(key, 'res', res);
        return res;
      };
    }
  : <T, U>(_: string, fn: (arg: T) => U) => fn;

export function process(
  src: string,
  filePath: Path,
  jestConfig: JestConfig,
  transformOptions: TransformOptions = { instrument: false },
) {
  // transformOptions.instrument is a proxy for collectCoverage
  // https://github.com/kulshekhar/ts-jest/issues/201#issuecomment-300572902
  const compilerOptions = getTSConfig(
    jestConfig.globals,
    jestConfig.rootDir,
    transformOptions.instrument,
  );

  logOnce('final compilerOptions:', compilerOptions);

  const isTsFile = /\.tsx?$/.test(filePath);
  const isJsFile = /\.jsx?$/.test(filePath);
  const isHtmlFile = /\.html$/.test(filePath);

  // This is to support angular 2. See https://github.com/kulshekhar/ts-jest/pull/145
  if (isHtmlFile && jestConfig.globals.__TRANSFORM_HTML__) {
    src = 'module.exports=`' + src + '`;';
  }

  const processFile =
    compilerOptions.allowJs === true ? isTsFile || isJsFile : isTsFile;

  if (!processFile) {
    return src;
  }

  const tsJestConfig = getTSJestConfig(jestConfig.globals);
  logOnce('tsJestConfig: ', tsJestConfig);

  if (tsJestConfig.enableTsDiagnostics) {
    runTsDiagnostics(filePath, compilerOptions);
  }

  const serviceHost: ts.LanguageServiceHost = {
    getScriptFileNames: () => {
      const returnarray = [filePath];
      // console.log('getScriptFileNames returning:', returnarray);
      return returnarray;
    },

    getScriptVersion: fileName => {
      // console.log('getScriptVersion called with ', fileName);
      return undefined as string;
    },

    getCurrentDirectory: () => {
      const dir = cwd();
      // console.log('working dir', dir);
      return dir;
    },

    getScriptSnapshot: fileName => {
      // console.log(`getScriptSnapshot called with ${fileName}`);
      if (fileName === filePath) {
        return ts.ScriptSnapshot.fromString(src); // jest has already served this file for us.
      }
      const result = fs.readFileSync(fileName, 'utf8');
      const snap = ts.ScriptSnapshot.fromString(result);
      // console.log('returning', snap);
      return snap;
    },

    getCompilationSettings: () => {
      // console.log('returning compiler options: ', compilerOptions);
      return compilerOptions;
    },

    getDefaultLibFileName: () => {
      const libfilepath = ts.getDefaultLibFilePath(compilerOptions);
      // console.log('returning lib file name', libfilepath);
      return libfilepath;
      // return 'lib.d.ts'
    },

    // debug stuff
    fileExists: debugFn('fileExists', ts.sys.fileExists),
    readFile: debugFn('readFile', ts.sys.readFile),
    readDirectory: debugFn('readDirectory', ts.sys.readDirectory),
    getDirectories: debugFn('getDirectories', ts.sys.getDirectories),
    directoryExists: debugFn('directoryExists', ts.sys.directoryExists),
  };

  const service = ts.createLanguageService(serviceHost);
  const serviceOutput = service.getEmitOutput(filePath);
  const files = serviceOutput.outputFiles.filter(file => {
    return file.name.endsWith('js'); // ignore declaration files
  });
  logOnce('JS files parsed', files.map(f => f.name));

  const diagnostics = service
    .getCompilerOptionsDiagnostics()
    .concat(service.getSyntacticDiagnostics(filePath))
    .concat(service.getSemanticDiagnostics(filePath));

  if (diagnostics.length > 0) {
    logOnce(
      `Diagnostic errors from TSC: ${diagnostics.map(d => d.messageText)}`,
    );
  }

  let tsTranspiledText = '';
  try {
    tsTranspiledText = files[0].text;
  } catch (e) {
    console.warn('errororrrrororo');
    console.warn('error ', e);
  }

  if (tsJestConfig.ignoreCoverageForAllDecorators === true) {
    tsTranspiledText = tsTranspiledText.replace(
      /__decorate/g,
      '/* istanbul ignore next */__decorate',
    );
  }
  if (tsJestConfig.ignoreCoverageForDecorators === true) {
    tsTranspiledText = tsTranspiledText.replace(
      /(__decorate\(\[\r?\n[^\n\r]*)\/\*\s*istanbul\s*ignore\s*decorator(.*)\*\//g,
      '/* istanbul ignore next$2*/$1',
    );
  }

  const postHook = getPostProcessHook(
    compilerOptions,
    jestConfig,
    tsJestConfig,
  );

  const outputText = postHook(
    tsTranspiledText,
    filePath,
    jestConfig,
    transformOptions,
  );

  const modified =
    tsJestConfig.disableSourceMapSupport === true
      ? outputText
      : injectSourcemapHook(filePath, tsTranspiledText, outputText);

  flushLogs();

  return modified;
}

export function getCacheKey(
  fileData: string,
  filePath: Path,
  jestConfigStr: string,
  transformOptions: TransformOptions = { instrument: false },
): string {
  const jestConfig: JestConfig = JSON.parse(jestConfigStr);

  const tsConfig = getTSConfig(
    jestConfig.globals,
    jestConfig.rootDir,
    transformOptions.instrument,
  );

  return crypto
    .createHash('md5')
    .update(JSON.stringify(tsConfig), 'utf8')
    .update(JSON.stringify(transformOptions), 'utf8')
    .update(fileData + filePath + jestConfigStr, 'utf8')
    .digest('hex');
}

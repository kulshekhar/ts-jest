// tslint:disable:member-ordering
import { TsJestInstance, TsJestGlobalOptions } from './types';
import TsProgram from './ts-program';

class TsJestTransformer implements jest.Transformer {
  private _instances = new Map<jest.Path, TsJestInstance>();
  instanceFor(
    jestConfig: jest.ProjectConfig,
    rootDir: jest.Path = jestConfig.rootDir || process.cwd(),
  ): TsJestInstance {
    if (this._instances.has(rootDir)) {
      return this._instances.get(rootDir) as TsJestInstance;
    }
    const { globals = {} } = jestConfig as any;
    const options: TsJestGlobalOptions = { ...globals['ts-jest'] };

    const shouldWrapHtml = !!globals.__TRANSFORM_HTML__;

    let tsProgram: TsProgram;
    const instance: TsJestInstance = {
      shouldWrapHtml,
      get tsProgram(): TsProgram {
        return tsProgram || (tsProgram = new TsProgram(rootDir, options));
      },
      get tsConfig() {
        return this.tsProgram.compilerOptions;
      },
      // TODO: get using babel-jest
      useBabelJest: options.useBabelJest !== false,
    };
    this._instances.set(rootDir, instance);
    return instance;
  }

  process(
    source: string,
    path: jest.Path,
    jestConfig: jest.ProjectConfig,
    transformOptions?: jest.TransformOptions,
  ): jest.TransformedSource | string {
    let result: string | jest.TransformedSource;

    // get the tranformer instance
    const instance = this.instanceFor(jestConfig);

    // transpile TS code (source maps are included)
    result = instance.tsProgram.transpileModule(
      path,
      source,
      transformOptions && transformOptions.instrument,
    );

    // calling babel-jest transformer
    if (instance.useBabelJest) {
      result = this.babelJest.process(
        result,
        path,
        jestConfig,
        transformOptions,
      );
    }

    return result;
  }

  private _babelJest!: jest.Transformer;
  get babelJest(): jest.Transformer {
    if (this._babelJest) return this._babelJest; // tslint:disable-line
    let babelJest = require('babel-jest');
    if (typeof babelJest.createTransformer === 'function') {
      babelJest = babelJest.createTransformer();
    }
    return (this._babelJest = babelJest);
  }

  // TODO: use jest-config package to try to get current config and see if we are going to use babel jest or not
  // in which case we'd return `true` there:
  // get canInstrument() {}
}

let transformer: jest.Transformer;
function createTransformer() {
  return (transformer = new TsJestTransformer());
}
function tsProcess(...args: any[]): any {
  return (createTransformer() as any).process(...args);
}

export { createTransformer, tsProcess as process };

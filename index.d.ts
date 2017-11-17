import * as _install from './install';
import * as preprocessor from './preprocessor';

interface TsJestModule {
  install: typeof _install.install;
  process: typeof preprocessor.process;
  getCacheKey: typeof preprocessor.getCacheKey;
}

declare const tsJestModule: TsJestModule;
export = tsJestModule;

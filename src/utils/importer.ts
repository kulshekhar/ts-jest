import Memoize from './memoize';
import { TClosestFileData, TBabelJest } from '../types';
import { patchBabelCore } from './hacks';
import { ImportReasons, Errors, interpolate } from './messages';

const importDefault = (mod: any) =>
  mod && mod.__esModule ? mod : { default: mod };

// When ading an optional dependency which has another reason, add the reason in ImportReasons, and
// create a new method in Importer. Thus uses the importer.yourMethod(ImportReasons.TheReason)
// in the relevant code, so that the user knows why it needs it and how to install it in the
// case it can't import.

class Importer {
  closestFileData(why: ImportReasons): TClosestFileData {
    return importDefault(this._import(why, 'closest-file-data')).default;
  }

  babelJest(why: ImportReasons): TBabelJest {
    const babel = importDefault(this._tryThese('babel-core')).default;
    if (babel) {
      patchBabelCore(babel);
    }
    return this._import(why, 'babel-jest');
  }

  protected _import(
    why: string,
    moduleName: string,
    // tslint:disable-next-line:trailing-comma
    ...orModuleNames: string[]
  ): any {
    const res = this._tryThese(moduleName, ...orModuleNames);
    if (!res) {
      const msg = orModuleNames.length
        ? Errors.UnableToLoadAnyModule
        : Errors.UnableToLoadOneModule;
      const loadModule = [moduleName, ...orModuleNames]
        .map(m => `"${m}"`)
        .join(', ');

      throw new Error(
        interpolate(msg, {
          loadModule,
          installModule: moduleName,
          loadReason: why,
        }),
      );
    }
    return res;
  }

  @Memoize((...args: string[]) => args.join(':'))
  protected _tryThese(moduleName: string, ...fallbacks: string[]): any {
    let name: string;
    const tries = [moduleName, ...fallbacks];
    // tslint:disable-next-line:no-conditional-assignment
    while ((name = tries.shift() as string) !== undefined) {
      try {
        return require(name);
      } catch (err) {}
    }
  }
}

export default new Importer();

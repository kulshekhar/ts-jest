import Memoize from './memoize';
import { TClosestFileData, TBabelJest, TBabelCore } from '../types';
import { patchBabelCore } from './hacks';
import { ImportReasons, Errors, interpolate, Helps } from './messages';

const importDefault = (mod: any) =>
  mod && mod.__esModule ? mod : { default: mod };

// When ading an optional dependency which has another reason, add the reason in ImportReasons, and
// create a new method in Importer. Thus uses the importer.yourMethod(ImportReasons.TheReason)
// in the relevant code, so that the user knows why it needs it and how to install it in the
// case it can't import.

interface ImportOptions {
  alternatives?: string[];
  installTip?: string | Array<{ module: string; label: string }>;
}

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

  babelCore(why: ImportReasons): TBabelCore {
    return this._import(why, '@babel/core', {
      alternatives: ['babel-core'],
      installTip: [
        { label: 'for Babel 7', module: `'babel-core@^7.0.0-0' @babel/core` },
        { label: 'for Babel 6', module: 'babel-core' },
      ],
    });
  }

  protected _import(
    why: string,
    moduleName: string,
    { alternatives = [], installTip = moduleName }: ImportOptions = {},
  ): any {
    const res = this._tryThese(moduleName, ...alternatives);
    if (!res) {
      const msg = alternatives.length
        ? Errors.UnableToLoadAnyModule
        : Errors.UnableToLoadOneModule;
      const loadModule = [moduleName, ...alternatives]
        .map(m => `"${m}"`)
        .join(', ');
      if (typeof installTip === 'string') {
        installTip = [{ module: installTip, label: `install "${installTip}"` }];
      }
      const fix = installTip
        .map(tip => {
          return `    ${installTip.length === 1 ? '↳' : '•'} ${interpolate(
            Helps.FixMissingModule,
            tip,
          )}`;
        })
        .join('\n');

      throw new Error(
        interpolate(msg, {
          module: loadModule,
          reason: why,
          fix,
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

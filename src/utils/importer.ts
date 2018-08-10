import Memoize from './memoize';
import { TClosestFileData } from '../types';

const importDefault = (mod: any) =>
  mod && mod.__esModule ? mod : { default: mod };

// When ading an optional dependency which has another reason, add the reason here, and
// create a new method in Importer. Thus uses the importer.yourMethod(ImportReasons.TheReason)
// in the relevant code, so that the user knows why it needs it and how to install it in the
// case it can't import.

export enum ImportReasons {
  babelJest = 'Using "babel-jest" requires this package to be installed',
  babelConfigLookup = 'Using "babel-jest" with config lookup relies on this package to be installed',
}

class Importer {
  closestFileData(why: ImportReasons): TClosestFileData {
    return this.import(why, 'closest-file-data').default;
  }

  protected import(
    why: string,
    moduleName: string,
    // tslint:disable-next-line:trailing-comma
    ...orModuleNames: string[]
  ): any {
    const res = this._tryThese(moduleName, ...orModuleNames);
    if (!res) {
      const what = orModuleNames.length
        ? 'any of these modules'
        : 'this module';
      const list = [moduleName, ...orModuleNames].join(', ');
      throw new Error(
        `[ts-jest] Unable to load ${what}: ${list}\n` +
          `  ${why}\n` +
          `    ↳ you can fix this by running: npm i -D ${moduleName}`,
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
        return importDefault(require(name));
      } catch (err) {}
    }
  }
}

export default new Importer();

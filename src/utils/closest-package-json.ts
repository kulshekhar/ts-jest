// we could have used `closest-file-data` but since it's more simple than finding babel
// config, if the user dosn't need babel processing he won't need to add closest-file-data
// to its dependencies
import { resolve, join } from 'path';
import { TPackageJson } from '../types';
import { existsSync, readFileSync } from 'fs';
import { Errors, interpolate } from './messages';

interface CacheItem {
  data: Readonly<TPackageJson>;
  _data?: Readonly<TPackageJson>;
  str: string;
}
export let cache: {
  [file: string]: CacheItem;
} = Object.create(null);

export default function ownerPackageData(
  fromPath: string,
  asString?: false,
): TPackageJson;
export default function ownerPackageData(
  fromPath: string,
  asString: true,
): string;
export default function ownerPackageData(
  fromPath: string,
  asString: boolean = false,
): TPackageJson | string {
  if (fromPath in cache) {
    return cache[fromPath][asString ? 'str' : 'data'];
  }

  let path: string = fromPath;
  let oldPath: string;
  let packagePath: string | undefined;
  do {
    oldPath = path;
    packagePath = join(path, 'package.json');
    if (existsSync(packagePath)) {
      break;
    }
  } while (
    // tslint:disable-next-line:no-conditional-assignment
    (path = resolve(path, '..')) !== oldPath ||
    // allows to reset the packagePath when exiting the loop
    // tslint:disable-next-line:no-conditional-assignment
    (packagePath = undefined)
  );

  // fail if not found
  if (!packagePath) {
    throw new Error(interpolate(Errors.UnableToFindPackageJson, { fromPath }));
  }

  const str = readFileSync(packagePath, 'utf8');
  const cached: CacheItem = Object.freeze({
    str,
    get data() {
      return (
        cached._data ||
        (cached._data = Object.freeze({ ...JSON.parse(cached.str) }))
      );
    },
  });
  cache[fromPath] = cached;
  return asString ? str : cached.data;
}

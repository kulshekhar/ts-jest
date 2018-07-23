import { createHash } from 'crypto';
import { JestCacheKeyOptions } from '../types';
import { relative } from 'path';
import { MY_PACKAGE_CONTENT } from './constants';
import getBabelRC from './get-babel-rc';
import getTSConfig from './get-ts-config';

// FIXME: remove dependency on config, it's empty
export default function getCacheKey(
  fileData: string,
  filePath: string,
  jestConfigString: string,
  { instrument, rootDir }: JestCacheKeyOptions,
): string {
  const jestConfig: jest.ProjectConfig = JSON.parse(jestConfigString) || {};
  delete jestConfig.cacheDirectory;
  delete jestConfig.name;
  const hash = createHash('md5')
    .update(MY_PACKAGE_CONTENT)
    .update('\0', 'utf8')
    .update(fileData)
    .update('\0', 'utf8')
    .update(relative(rootDir, filePath))
    .update('\0', 'utf8')
    .update(jestConfigString)
    .update('\0', 'utf8')
    .update(JSON.stringify(getTSConfig(jestConfig)))
    .update('\0', 'utf8');
  const babelRc = getBabelRC(filePath);
  if (babelRc) {
    hash.update(JSON.stringify(babelRc)).update('\0', 'utf8');
  }
  return hash.update(instrument ? 'instrument' : '').digest('hex');
}

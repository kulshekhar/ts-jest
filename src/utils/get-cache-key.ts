import { JestCacheKeyOptions } from '../types';
import { relative } from 'path';
import { MY_PACKAGE_CONTENT } from './constants';
import getBabelRC from './get-babel-rc';
import getTSConfig from './get-ts-config';

export default function getCacheKey(
  fileData: string,
  filePath: string,
  jestConfigString: string,
  { instrument, rootDir }: JestCacheKeyOptions,
): string {
  const jestConfig: jest.ProjectConfig = JSON.parse(jestConfigString) || {};
  delete jestConfig.cacheDirectory;
  delete jestConfig.name;
  // jest creates hash under the hoods
  return JSON.stringify([
    MY_PACKAGE_CONTENT,
    fileData,
    relative(rootDir, filePath),
    jestConfig,
    getTSConfig(jestConfig),
    getBabelRC(filePath),
    instrument,
  ]);
}

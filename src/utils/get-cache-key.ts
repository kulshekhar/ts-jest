import { createHash } from 'crypto';
import { JestCacheKeyArguments, TsJestContext } from '../types';
import { relative, resolve } from 'path';
import { MY_PACKAGE_CONTENT } from './constants';
import getBabelRC from './get-babel-rc';
import { getTSConfig } from '.';

export default function getCacheKey(
  args: JestCacheKeyArguments,
  ctx: TsJestContext,
): string {
  const [fileData, filePath, jestConfigString, { instrument, rootDir }] = args;
  const glob = JSON.parse(jestConfigString).globals || {};
  return createHash('md5')
    .update(MY_PACKAGE_CONTENT)
    .update('\0', 'utf8')
    .update(JSON.stringify(ctx.options))
    .update('\0', 'utf8')
    .update(fileData)
    .update('\0', 'utf8')
    .update(relative(rootDir, filePath))
    .update('\0', 'utf8')
    .update(jestConfigString)
    .update('\0', 'utf8')
    .update(JSON.stringify(getTSConfig(glob, rootDir)))
    .update('\0', 'utf8')
    .update(getBabelRC(filePath, ctx))
    .update('\0', 'utf8')
    .update(instrument ? 'instrument' : '')
    .digest('hex');
}

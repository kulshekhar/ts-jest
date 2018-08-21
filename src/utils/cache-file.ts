import { join } from 'path';
import { createHash } from 'crypto';
import { outputFileSync } from 'fs-extra';
import { memoize } from 'lodash';

// to use the same compiled regexp object all the time
// See https://jsperf.com/string-match-str-re/1
const memoizedRegexp = memoize(RegExp);
const cachedTest = (
  reString: string | undefined | null,
  subject: string,
): boolean => {
  if (reString == null) {
    return false;
  }
  return memoizedRegexp(reString).test(subject);
};

const cachedMd5 = memoize((path: string) =>
  createHash('md5')
    .update(path)
    .digest('hex'),
);

// FIXME: I think there is testRegexp and testMatch in Jest configugation
// There is a default setting for that, but maybe it's defaulted from scratch
export function cacheFile(
  jestConfig: jest.ProjectConfig,
  filePath: string,
  src: string,
): void {
  // store transpiled code contains source map into cache, except test cases
  if (!cachedTest(jestConfig.testRegex, filePath)) {
    const hash = cachedMd5(filePath);
    const outputFilePath = join(jestConfig.cacheDirectory, 'ts-jest', hash);
    outputFileSync(outputFilePath, src);
  }
}

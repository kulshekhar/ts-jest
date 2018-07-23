import getCacheKey from '../../dist/utils/get-cache-key';
import cfg from '../__helpers__/jest-config';

describe('getCacheKey', () => {
  const src = 'console.log(123);';
  const jestConfig = cfg.simple(null, {
    transform: { '^.+\\\\.tsx?$': '../../preprocessor.js' },
    testRegex: '(/__tests__/.*|(\\\\.|/)(test|spec))\\\\.(jsx?|tsx?)$',
  });
  const filepath = `${jestConfig.rootDir}/some-file.ts`;
  const configStr = JSON.stringify(jestConfig);
  const options = { instrument: false, rootDir: jestConfig.rootDir };
  const originalHash = getCacheKey(src, filepath, configStr, options);

  it('should change hash when src changes', () => {
    const newSrc = 'console.log(1234);';
    const newHash = getCacheKey(newSrc, filepath, configStr, options);
    expect(newHash).not.toBe(originalHash);
  });

  it('should change hash when filepath changes', () => {
    const newPath = `${jestConfig.rootDir}/some-other-file.ts`;
    const newHash = getCacheKey(src, newPath, configStr, options);
    expect(newHash).not.toBe(originalHash);
  });

  it('should change hash when transform options change', () => {
    const newOptions = { ...options, instrument: true };
    const newHash = getCacheKey(src, filepath, configStr, newOptions);
    expect(newHash).not.toBe(originalHash);
  });

  // TODO: test when package dependencies change
});

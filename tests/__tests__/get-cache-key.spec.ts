import { getCacheKey } from "../../src/preprocessor";

describe('getCacheKey', () => {
  const src = 'console.log(123);';
  const filepath = '/tmp/filepath';
  const configStr = `{
    "globals": {
      "__TS_CONFIG": {
        "compilerOptions": {
          "target": "ES5",
          "module": "commonjs"
        }
      }
    },
    "transform": {
      ".(ts|tsx)": "../../preprocessor.js"
    },
    "testRegex": "(/__tests__/.*|\\\\.(test|spec))\\\\.(ts|tsx|js)$"
  }`;
  const originalHash = getCacheKey(src, filepath, configStr);

  it('should change hash when src changes', () => {
    const newSrc = 'console.log(1234);'
    const newHash = getCacheKey(newSrc, filepath, configStr);
    expect(newHash).not.toBe(originalHash);
  });

  it('should change hash when filepath changes', () => {
    const newPath = '/tmp/newfilepath'
    const newHash = getCacheKey(src, newPath, configStr);
    expect(newHash).not.toBe(originalHash);
  });

  it('should change hash when tsconfig changes', () => {
    const newConfigStr = configStr.replace(`"ES5"`, `"ES2015"`);
    const newHash = getCacheKey(src, filepath, newConfigStr);
    expect(newHash).not.toBe(originalHash);
  });

});

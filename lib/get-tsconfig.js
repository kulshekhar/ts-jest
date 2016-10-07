/**
 * Try to get tsconfig from package.json
 * Under key
 * "tsJest" : {
 *   "tsconfig": "my-tsconfig.json"
 * }
 * Supports relative or absolute path
 * Will fallback to "<rootDir>/tsconfig.json"
 */
const path = require('path');
const objectPath = require('object-path');

const getTsCfgOrThrow = (tsCfgPath) => {
  try {
    return require(tsCfgPath);
  } catch (er) {
    console.log('Failed to require tsconfig', tsCfgPath);
    throw er;
  }
};

module.exports = ({ config }) => {
  const { rootDir } = config;
  // Look for "tsJest" in package.json
  const pkg = require(path.resolve(rootDir, 'package.json'));
  // Access tsConfig prop if exist
  const customTsCfgPath = objectPath.get(pkg, [
    'tsJest',
    'tsconfig'
  ]);

  let tsConfig;
  // If exist
  if (customTsCfgPath && customTsCfgPath.length > 0) {
    // Handle absolute or relative paths
    if (path.isAbsolute(customTsCfgPath)) {
      tsConfig = getTsCfgOrThrow(customTsCfgPath);
    } else {
      tsConfig = getTsCfgOrThrow(
        path.resolve(rootDir, customTsCfgPath)
      );
    }
  } else {
    // Try default tsconfig if none was provided
    tsConfig = getTsCfgOrThrow(
      path.resolve(rootDir, 'tsconfig.json')
    );
  }

  return tsConfig;
};

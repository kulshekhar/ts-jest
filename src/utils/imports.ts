import {
  TBabel,
  TBabelPresetEnv,
  TBabelPluginIstanbul,
  TBabelPresetJest,
} from '../types';

export function importBabelCore(): TBabel {
  const mod = tryRequire('@babel/core') || tryRequire('babel-core');
  if (!mod) {
    throw new Error(
      `[ts-jest] You must install the '@babel/core' or 'babel-core'` +
        ` package (depending on the version you want to use).`,
    );
  }
  return mod;
}

export function importBabelPresetEnv(): TBabelPresetEnv {
  const mod = tryRequire('@babel/preset-env') || tryRequire('babel-preset-env');
  if (!mod) {
    throw new Error( // babel-jest has the env preset as a dep
      `[ts-jest] You must install the 'babel-jest' package if you're using babel.`,
    );
  }
  return mod;
}

export function importBabelPresetJest(): TBabelPresetJest {
  const mod = tryRequire('babel-preset-jest');
  if (!mod) {
    throw new Error( // babel-jest has the jest preset as a dep
      `[ts-jest] You must install the 'babel-jest' package if you're using babel.`,
    );
  }
  return mod;
}

export function importBabelPluginIstanbul(): TBabelPluginIstanbul {
  const mod = tryRequire('babel-plugin-istanbul');
  if (!mod) {
    throw new Error( // babel-jest has the istanbul plugin as a dep
      `[ts-jest] You must install the 'babel-jest' package if you're using babel.`,
    );
  }
  return mod.default;
}

function tryRequire<T = any>(packageName: string): T | void {
  let mod: T;
  try {
    mod = require(packageName);
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') throw err; // tslint:disable-line
  }
  return mod;
}

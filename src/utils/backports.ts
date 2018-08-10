function warn(...data: any[]) {
  console.warn(...data);
}

function warnConfig(fromPath: string, toPath: string, note?: string) {
  warn(
    `"{jest-config}.${fromPath}" is deprecated, use "{jest-config}.${toPath}" instead.\n` +
      `    ↳ ${note}`,
  );
}

export function backportJestConfig<
  T extends jest.InitialOptions | jest.ProjectConfig
>(config: T = {} as any): T {
  const { globals = {} } = config as any;
  const { 'ts-jest': tsJest = {} } = globals as any;
  const mergeTsJest: any = {};

  if ('__TS_CONFIG__' in globals) {
    warnConfig('globals.__TS_CONFIG__', 'globals.ts-jest.tsConfig');
    if (typeof globals.__TS_CONFIG__ === 'object') {
      mergeTsJest.tsConfig = globals.__TS_CONFIG__;
    }
    delete globals.__TS_CONFIG__;
  }

  if ('__TRANSFORM_HTML__' in globals) {
    warnConfig(
      'globals.__TRANSFORM_HTML__',
      'globals.ts-jest.stringifyContentRegex',
    );
    if (globals.__TRANSFORM_HTML__) {
      mergeTsJest.stringifyContentRegex = /\.html?$/;
    }
    delete globals.__TRANSFORM_HTML__;
  }

  if ('tsConfigFile' in tsJest) {
    warnConfig('globals.ts-jest.tsConfigFile', 'globals.ts-jest.tsConfig');
    if (tsJest.tsConfigFile) {
      mergeTsJest.tsConfig = tsJest.tsConfigFile;
    }
    delete tsJest.tsConfigFile;
  }

  if ('useBabelrc' in tsJest) {
    warnConfig(
      'globals.ts-jest.useBabelrc',
      'globals.ts-jest.babelJest',
      'See `babel-jest` related issue: https://github.com/facebook/jest/issues/3845',
    );
    if (tsJest.useBabelrc != null) {
      mergeTsJest.babelJest = tsJest.useBabelrc ? true : {};
    }
    delete tsJest.useBabelrc;
  }

  if ('babelConfig' in tsJest) {
    warnConfig('globals.ts-jest.babelConfig', 'globals.ts-jest.babelJest');
    if (tsJest.babelConfig != null) {
      mergeTsJest.babelJest = tsJest.babelConfig;
    }
    delete tsJest.useBabelrc;
  }

  if ('skipBabel' in tsJest) {
    warnConfig('globals.ts-jest.skipBabel', 'globals.ts-jest.babelJest');
    if (tsJest.skipBabel === false && !mergeTsJest.babelJest) {
      mergeTsJest.babelJest = true;
    }
    delete tsJest.skipBabel;
  }

  return {
    ...(config as any),
    globals: {
      ...globals,
      'ts-jest': {
        ...mergeTsJest,
        ...tsJest,
      },
    },
  };
}

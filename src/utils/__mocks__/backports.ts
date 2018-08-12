import * as _backports from '../backports';

export const backportJestConfig: typeof _backports['backportJestConfig'] = val => ({
  ...(val as any),
});

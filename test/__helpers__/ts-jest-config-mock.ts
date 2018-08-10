import { TsJestGlobalOptions } from '../../src/types';

export default function tsJestConfigMock<T extends TsJestGlobalOptions>(
  options: TsJestGlobalOptions,
): T {
  return { ...options } as any;
}

import { resolve } from 'path'

export default function jestRootDir(
  jestConfig: jest.ProjectConfig | jest.InitialOptions,
): string {
  return resolve(process.cwd(), jestConfig.rootDir || '.')
}

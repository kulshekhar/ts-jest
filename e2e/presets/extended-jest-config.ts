import {
  createDefaultPreset,
  createDefaultEsmPreset,
  createJsWithTsPreset,
  createJsWithTsEsmPreset,
  createJsWithBabelPreset,
  createJsWithBabelEsmPreset,
  type JestConfigWithTsJest,
} from 'ts-jest'

const defaultPreset: JestConfigWithTsJest = {
  ...createDefaultPreset(),
  testEnvironment: 'jsdom',
}

const defaultEsmPreset: JestConfigWithTsJest = {
  ...createDefaultEsmPreset(),
  testEnvironment: 'jsdom',
}

const jsWithTsPreset: JestConfigWithTsJest = {
  ...createJsWithTsPreset(),
  testEnvironment: 'jsdom',
}

const jsWithTsEsmPreset: JestConfigWithTsJest = {
  ...createJsWithTsEsmPreset(),
  testEnvironment: 'jsdom',
}

const jsWithBabelPreset: JestConfigWithTsJest = {
  ...createJsWithBabelPreset(),
  testEnvironment: 'jsdom',
}

const jsWithBabelEsmPreset: JestConfigWithTsJest = {
  ...createJsWithBabelEsmPreset(),
  testEnvironment: 'jsdom',
}

export default {
  defaultPreset,
  defaultEsmPreset,
  jsWithTsPreset,
  jsWithTsEsmPreset,
  jsWithBabelPreset,
  jsWithBabelEsmPreset,
}

const { createDefaultPreset } = require('ts-jest');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  displayName: 'project-1',
  ...createDefaultPreset({
    isolatedModules: true,
  })
}

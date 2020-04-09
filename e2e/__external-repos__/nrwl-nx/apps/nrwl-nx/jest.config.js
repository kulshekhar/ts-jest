module.exports = {
  name: 'tsjest-cannot-find-source-file',
  preset: '../../jest.config.js',
  coverageDirectory: '../../coverage/apps/tsjest-cannot-find-source-file',
  snapshotSerializers: [
    'jest-preset-angular/build/AngularNoNgAttributesSnapshotSerializer.js',
    'jest-preset-angular/build/AngularSnapshotSerializer.js',
    'jest-preset-angular/build/HTMLCommentSerializer.js',
  ],
}

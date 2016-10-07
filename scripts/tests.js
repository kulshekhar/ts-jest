process.env.NODE_ENV = 'test';
process.env.PUBLIC_URL = '';

const jest = require('jest');
const fs = require('fs');

const argv = process.argv.slice(2);
argv.push('--no-cache');
// Watch unless on CI
if (!process.env.CI) {
  argv.push('--watch');
}

try {
  fs.symlinkSync('../', './node_modules/ts-jest', 'dir');
}
catch (err) {
  if (err.code !== 'EEXIST') {
    //rethrow error
    throw err;
  }
  //nothing to do, because symlink already exist and this is that we need
}

jest.run(argv);

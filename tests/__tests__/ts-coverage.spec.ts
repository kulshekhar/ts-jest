import runJest from '../__helpers__/runJest';
import * as fs from 'fs';
import * as path from 'path';

describe('hello_world', () => {
  const snapshot =
    `------------------|----------|----------|----------|----------|----------------|
File              |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
------------------|----------|----------|----------|----------|----------------|
 simple${path.sep}          |    66.67 |    33.33 |    66.67 |    61.54 |                |
  Hello.ts        |    90.91 |       50 |       80 |    88.89 |             20 |
  NullCoverage.js |        0 |        0 |        0 |        0 |        1,2,3,5 |
------------------|----------|----------|----------|----------|----------------|
All files         |    66.67 |    33.33 |    66.67 |    61.54 |                |
------------------|----------|----------|----------|----------|----------------|
`;

  it('should run successfully', () => {
    runJest('../simple', ['--no-cache', '--coverage']);

    const coveragePath = path.resolve('./tests/simple/coverage/remapped/coverage.txt');

    expect(fs.statSync(coveragePath).isFile()).toBeTruthy();
    expect(fs.readFileSync(coveragePath, 'utf-8')).toEqual(snapshot);
  });

  it('should run successfully with a custom coverage directory', () => {
    runJest('../simple', ['--no-cache', '--coverage', '--config', '../simple/with-coverage-dir.json']);

    const coveragePath = path.resolve('./tests/simple/coverage-custom/remapped/coverage.txt');

    expect(fs.statSync(coveragePath).isFile()).toBeTruthy();
  });

});

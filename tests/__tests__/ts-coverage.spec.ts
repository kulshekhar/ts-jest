import runJest from '../__helpers__/runJest';
import * as fs from 'fs';
import * as path from 'path';

describe('hello_world', () => {
  const snapshot =
    `------------------|----------|----------|----------|----------|----------------|
File              |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
------------------|----------|----------|----------|----------|----------------|
 simple/          |    71.43 |    33.33 |    66.67 |    66.67 |                |
  Hello.ts        |    90.91 |       50 |       80 |    88.89 |             20 |
  NullCoverage.js |        0 |        0 |        0 |        0 |          2,3,5 |
------------------|----------|----------|----------|----------|----------------|
All files         |    71.43 |    33.33 |    66.67 |    66.67 |                |
------------------|----------|----------|----------|----------|----------------|
`;

  it('should run successfully', () => {
    runJest('../simple', ['--no-cache', '--coverage']);

    const coveragePath = path.resolve('./tests/simple/coverage/remapped/coverage.txt');

    expect(fs.statSync(coveragePath).isFile()).toBeTruthy();
    expect(fs.readFileSync(coveragePath, 'utf-8')).toEqual(snapshot);
  });

});

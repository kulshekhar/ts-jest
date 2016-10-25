import runJest from '../__helpers__/runJest';
import * as fs from 'fs';
import * as path from 'path';

describe('hello_world', () => {
  const snapshot =
    `-----------|----------|----------|----------|----------|----------------|
File       |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
-----------|----------|----------|----------|----------|----------------|
 simple${path.sep}   |    90.91 |       50 |       80 |    88.89 |                |
  Hello.ts |    90.91 |       50 |       80 |    88.89 |             20 |
-----------|----------|----------|----------|----------|----------------|
All files  |    90.91 |       50 |       80 |    88.89 |                |
-----------|----------|----------|----------|----------|----------------|
`;

  it('should run successfully', () => {
    runJest('../simple', ['--no-cache', '--coverage']);

    const coveragePath = './tests/simple/coverage/remapped/coverage.txt';

    expect(fs.existsSync(coveragePath)).toBeTruthy();
    expect(fs.readFileSync(coveragePath, 'utf-8')).toEqual(snapshot);
  });

});
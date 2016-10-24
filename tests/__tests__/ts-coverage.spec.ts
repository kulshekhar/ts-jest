import runJest from '../__helpers__/runJest';
import * as fs from 'fs';
import * as path from 'path';

describe('hello_world', () => {
  const snapshot =
  `-----------|----------|----------|----------|----------|----------------|
File       |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
-----------|----------|----------|----------|----------|----------------|
 simple${path.sep}   |    85.71 |    33.33 |       75 |    85.71 |                |
  Hello.ts |    85.71 |    33.33 |       75 |    85.71 |             20 |
-----------|----------|----------|----------|----------|----------------|
All files  |    85.71 |    33.33 |       75 |    85.71 |                |
-----------|----------|----------|----------|----------|----------------|
`;

  it('should run successfully', () => {
    runJest('../simple', ['--no-cache', '--coverage']);

    const coveragePath = path.normalize('tests/simple/coverage/remapped/coverage.txt');

    expect(fs.existsSync(coveragePath)).toBeTruthy();
    expect(fs.readFileSync(coveragePath, 'utf-8')).toEqual(snapshot);
  });

});
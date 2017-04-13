import runJest from '../__helpers__/runJest';
import * as fs from 'fs';
import * as path from 'path';

describe('Long (but not too long) path', () => {
  const snapshot =
    `-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|----------|----------|----------|----------------|
File                                                                                                                                                                                                                   |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|----------|----------|----------|----------------|
 simple-long-long-long-long-long--long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long/ |    57.14 |        0 |    66.67 |       50 |                |
  Hello.ts                                                                                                                                                                                                             |      100 |      100 |      100 |      100 |                |
  NullCoverage.js                                                                                                                                                                                                      |        0 |        0 |        0 |        0 |          2,3,5 |
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|----------|----------|----------|----------------|
All files                                                                                                                                                                                                              |    57.14 |        0 |    66.67 |       50 |                |
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|----------|----------|----------|----------------|
`;

  it('should work as expected', () => {
    runJest('../simple-long-long-long-long-long--long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long', ['--no-cache', '--coverage']);

    const coveragePath = path.resolve('./tests/simple-long-long-long-long-long--long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long-long/coverage/remapped/coverage.txt');

    expect(fs.statSync(coveragePath).isFile()).toBeTruthy();
    expect(fs.readFileSync(coveragePath, 'utf-8')).toEqual(snapshot);
  });

});

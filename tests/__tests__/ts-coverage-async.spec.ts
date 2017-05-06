import runJest from '../__helpers__/runJest';
import * as fs from 'fs';
import * as path from 'path';

describe('hello_world', () => {
  const snapshot =
    `------------------|----------|----------|----------|----------|----------------|
File              |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
------------------|----------|----------|----------|----------|----------------|
 simple-async${path.sep}    |    66.67 |    33.33 |    66.67 |    61.54 |                |
  Hello.ts        |    90.91 |       50 |       80 |    88.89 |             20 |
  NullCoverage.js |        0 |        0 |        0 |        0 |        1,2,3,5 |
------------------|----------|----------|----------|----------|----------------|
All files         |    66.67 |    33.33 |    66.67 |    61.54 |                |
------------------|----------|----------|----------|----------|----------------|
`;

  it('should run successfully', () => {
    const result = runJest('../simple-async', ['--no-cache', '--coverage']);

    const output = result.stdout.toString();

    expect(output).toContain('Statements   : 66.67% ( 10/15 )');
    expect(output).toContain('Branches     : 33.33% ( 2/6 )');
    expect(output).toContain('Functions    : 66.67% ( 4/6 )');
    expect(output).toContain('Lines        : 61.54% ( 8/13 )');
  });

});

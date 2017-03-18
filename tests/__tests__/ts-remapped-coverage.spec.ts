import runJest from '../__helpers__/runJest';
import * as fs from 'fs';
import * as path from 'path';

describe('tsremappedcoverage', () => {
  const snapshot =
    `---------------------|----------|----------|----------|----------|----------------|
File                 |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
---------------------|----------|----------|----------|----------|----------------|
 tsremappedcoverage${path.sep} |      100 |      100 |      100 |      100 |                |
  a.ts               |      100 |      100 |      100 |      100 |                |
  b.ts               |      100 |      100 |      100 |      100 |                |
---------------------|----------|----------|----------|----------|----------------|
All files            |      100 |      100 |      100 |      100 |                |
---------------------|----------|----------|----------|----------|----------------|
`;

  it('should run successfully', () => {
    runJest('../tsremappedcoverage', ['--no-cache', '--coverage']);

    const coveragePath = path.resolve('./tests/tsremappedcoverage/coverage/remapped/coverage.txt');

    expect(fs.statSync(coveragePath).isFile()).toBeTruthy();
    expect(fs.readFileSync(coveragePath, 'utf-8')).toEqual(snapshot);
  });

});
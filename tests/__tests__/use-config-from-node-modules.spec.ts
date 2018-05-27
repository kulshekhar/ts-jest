import * as fs from 'fs-extra';
import * as path from 'path';
import runJest from '../__helpers__/runJest';

describe('Use config from node_modules', () => {
  it('Should run all tests', () => {
    const testDir = path.resolve(__dirname, '../use-config-from-node-modules');
    const configPath = path.resolve(testDir, 'tsconfig.json');
    const targetDir = path.resolve(testDir, 'node_modules', 'common-tsconfig');
    const targetConfigPath = path.resolve(targetDir, 'tsconfig.json');
    fs.ensureDirSync(targetDir);
    fs.copySync(configPath, targetConfigPath);

    const result = runJest('../use-config-from-node-modules', ['--no-cache']);
    const stderr = result.stderr;

    expect(result.status).toBe(1);
    expect(stderr).toContain('1 failed, 1 total');
    expect(stderr).toContain('Hello Class');
    expect(stderr).toContain('should throw an error on line 18');
  });
});

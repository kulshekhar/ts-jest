import { } from 'jest';
import { } from 'node';
import { ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import runJestInWatchMode from '../__helpers__/runJestInWatchMode';

const helloFile = fs.readFileSync(path.resolve(__dirname, '../watch-test/Hello.ts'), 'utf8');
const helloFileUpdate = `export class Hello {
  constructor() {
    const greeting = \`
      this is a
      multiline
      greeting
    \`;

    this.unexcuted(() => { });

    throw new Error('Hello error!');
  }

  public unexcuted(action: () => void = () => {}): void {
    if (action) {
        action();
    } else {
        console.log('unexcuted');
    }
  }
}
`;
const testFile = fs.readFileSync(path.resolve(__dirname, '../watch-test/__tests__/Hello.test.ts'), 'utf8');
const testFileUpdate = `declare var jest, describe, it, expect;

import {Hello} from '../Hello';

describe('Hello Class', () => {

  it('should throw an error on line 11', () => {



    const hello = new Hello();

  });

});
`;

describe('hello_world', () => {
  let result: { childProcess: ChildProcess, getStderrAsync: () => Promise<string> };
  let DEFAULT_TIMEOUT_INTERVAL: number;

  beforeAll(() => {
    result = runJestInWatchMode('../watch-test');
    DEFAULT_TIMEOUT_INTERVAL = jasmine['DEFAULT_TIMEOUT_INTERVAL'];
    jasmine['DEFAULT_TIMEOUT_INTERVAL'] = 10000;
  });

  it('should show the correct error locations in the typescript files without changes', () => {
    return result.getStderrAsync().then((stderr) => {
      expect(stderr).toContain('Hello.ts:13:11');
      expect(stderr).toContain('Hello.test.ts:9:19');
    });
  });

  it('should show the correct error locations in the typescript files with changes in source file', () => {
    let promise = result.getStderrAsync().then((stderr) => {
      expect(stderr).toContain('Hello.ts:11:11');
      expect(stderr).toContain('Hello.test.ts:9:19');
    });
    fs.writeFileSync(path.resolve(__dirname, '../watch-test/Hello.ts'), helloFileUpdate);
    return promise;
  });

  it('should show the correct error locations in the typescript files with changes in source file and test file', () => {
    let promise = result.getStderrAsync().then((stderr) => {
      expect(stderr).toContain('Hello.ts:11:11');
      expect(stderr).toContain('Hello.test.ts:11:19');
    });
    fs.writeFileSync(path.resolve(__dirname, '../watch-test/__tests__/Hello.test.ts'), testFileUpdate);
    return promise;
  });

  afterAll(() => {
    result.childProcess.kill();
    // revert changes back
    jasmine['DEFAULT_TIMEOUT_INTERVAL'] = DEFAULT_TIMEOUT_INTERVAL;
    fs.writeFileSync(path.resolve(__dirname, '../watch-test/Hello.ts'), helloFile);
    fs.writeFileSync(path.resolve(__dirname, '../watch-test/__tests__/Hello.test.ts'), testFile);
  });
});
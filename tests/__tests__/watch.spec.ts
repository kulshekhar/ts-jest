import { } from 'jest';
import { } from 'node';
import { ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import runJestInWatchMode from '../__helpers__/runJestInWatchMode';

const helloFile = `export class Hello {
  constructor() {
    const greeting = \`
      this
      is
      a
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
const testFile = `declare var jest, describe, it, expect;

import {Hello} from '../Hello';

describe('Hello Class', () => {

  it('should throw an error on line 11', () => {

    const hello = new Hello();

  });

});
`;
const testFileUpdate = `declare var jest, describe, it, expect;

import {Hello} from '../Hello';

describe('Hello Class', () => {

  it('should throw an error on line 11', () => {



    const hello = new Hello();

  });

});
`;

describe('hello_world', () => {
  let result: { process: ChildProcess, getStderrAsync: () => Promise<string> };

  beforeAll(() => {
    result = runJestInWatchMode('../watch-test');
  });

  it('should show the correct error locations in the typescript files without changes', async () => {
    let stderr = await result.getStderrAsync();
    expect(stderr).toContain('Hello.ts:13:11');
    expect(stderr).toContain('Hello.test.ts:9:19');
  });

  it('should show the correct error locations in the typescript files with changes in source file', async () => {
    fs.writeFileSync(path.resolve(__dirname, '../watch-test/Hello.ts'), helloFileUpdate);
    let stderr = await result.getStderrAsync();
    expect(stderr).toContain('Hello.ts:11:11');
    expect(stderr).toContain('Hello.test.ts:9:19');
  });

  it('should show the correct error locations in the typescript files with changes in source file and test file', async () => {
    fs.writeFileSync(path.resolve(__dirname, '../watch-test/__tests__/Hello.test.ts'), testFileUpdate);
    let stderr = await result.getStderrAsync();
    expect(stderr).toContain('Hello.ts:11:11');
    expect(stderr).toContain('Hello.test.ts:11:19');
  });

  afterAll(() => {
    result.process.kill();
    // revert changes back
    fs.writeFileSync(path.resolve(__dirname, '../watch-test/Hello.ts'), helloFile);
    fs.writeFileSync(path.resolve(__dirname, '../watch-test/__tests__/Hello.test.ts'), testFile);
  });
});
import { consoleLog, throwError } from './main';

describe('console.log()', () => {
  test('from sources', () => {
    consoleLog();
    expect(true).toBe(true);
  });
  test('from tests', () => {
    console.log('WITHIN TEST');
    expect(true).toBe(true);
  });
});

describe('throw new Error()', () => {
  test('throws from sources', () => {
    throwError();
    expect(true).toBe(true);
  });
  test('throws from tests', () => {
    throw new Error('WITHIN TEST');
    expect(true).toBe(true);
  });
});

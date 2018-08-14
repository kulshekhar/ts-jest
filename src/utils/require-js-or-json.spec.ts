import requireJsOrJson from './require-js-or-json';
import parseJsonUnsafe from './parse-json-unsafe';
import { readFileSync } from 'fs';

const NON_REQUIRABLE_FILE = '/there/foo.bar';

jest.mock('fs', () => ({
  readFileSync: jest.fn((path: string) => ({ path })),
}));
jest.mock('./parse-json-unsafe', () => jest.fn(v => v));
jest.mock('/foo/bar.js', () => ({ path: '/foo/bar.js' }), { virtual: true });

describe('require-able', () => {
  it('should not call parseJsonUnsafe nor readFileSync', () => {
    const v = requireJsOrJson('/foo/bar.js');
    expect(v).toEqual({ path: '/foo/bar.js' });
    expect(parseJsonUnsafe).not.toHaveBeenCalled();
    expect(readFileSync).not.toHaveBeenCalled();
  });
});

describe('not require-able', () => {
  it('should fallback to readFileSync + parseJsonUnsafe', () => {
    const v = requireJsOrJson(NON_REQUIRABLE_FILE);
    expect(v).toEqual({ path: NON_REQUIRABLE_FILE });
    expect(parseJsonUnsafe).toHaveBeenCalledTimes(1);
    expect(readFileSync).toHaveBeenCalledTimes(1);
  });
});

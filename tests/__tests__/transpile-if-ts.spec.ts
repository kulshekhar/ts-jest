import { transpileIfTypescript } from '../../src';

describe('transpileIfTypescript', () => {
    it('should ignore anything non-TS', () => {
        const contents = 'unaltered';
        expect(transpileIfTypescript('some.js', contents)).toBe(contents);
    });
    it('should be able to transpile some TS', () => {
        const ts = 'const x:string = "anything";';
        expect(transpileIfTypescript('some.ts', ts)).toMatch('var x = "anything";');
        expect(transpileIfTypescript('some.tsx', ts)).toMatch('var x = "anything";');
    });

    it('should be possible to pass a custom config', () => {
        const customTsConfigFile = 'not-existant.json';
        const customConfig = { __TS_CONFIG__: customTsConfigFile};
        expect(() => transpileIfTypescript('some.ts', '', customConfig)).toThrow(new RegExp(customTsConfigFile));
    });
});

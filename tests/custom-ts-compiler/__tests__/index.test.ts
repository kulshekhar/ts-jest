/// <reference types="ts-nameof" />

describe('ttypescript', () => {
  it('should transform nameof calls via ts-nameof transformer', () => {
    expect(nameof<RegExp>()).toBe('RegExp');
  });
});

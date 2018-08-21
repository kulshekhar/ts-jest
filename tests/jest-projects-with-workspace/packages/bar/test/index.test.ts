import bar from '../src';

test('bar says...', () => {
  expect(bar('hi')).toBe('bar says "hi"');
});

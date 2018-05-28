import foo from '../src';

test('foo says...', () => {
  expect(foo('hi')).toBe('foo says "hi"');
});

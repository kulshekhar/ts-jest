// declare var jest, describe, it, expect;

describe('Dynamically importing thing class', () => {
  it('should work as expected', async () => {
    const t = await import('../thing');

    const t1 = new t.Thing();
    expect(t1.name).toBe('Default Name');

    const t2 = new t.Thing('aa');
    expect(t2.name).toBe('aa');
  });
});

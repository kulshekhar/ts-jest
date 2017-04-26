import mod from '../module';
import 'jest';


describe('the module which has no default export', () => {
  // do some es6 stuff
  it('should return sensible values when trying to access its exports', async () => {
    expect(mod.someExport).toBe('someExport');
  });
});

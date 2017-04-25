import mod from '../module';
import 'jest';


describe('the module which has no default export', () => {
  it('should return sensible values when trying to access its exports', () => {
    expect(mod.someExport).toBe('someExport');
  });
});

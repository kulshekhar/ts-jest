import runJest from '../__helpers__/runJest';
import { process } from '../../src/preprocessor';
import * as utils from '../../src/utils';

describe('sourcemap-support', () => {
  function runProcess(jestConfig = {}) {
    return process('input_code', 'fake_file.ts', jestConfig, {
      instrument: false,
    });
  }

  it('should be used by default', () => {
    const spy = jest.spyOn(utils, 'injectSourcemapHook');

    runProcess();
    expect(spy).toHaveBeenCalled();

    spy.mockReset();
    spy.mockRestore();
  });

  it(`should not be used when the disableSourceMapSupport flag is set to true`, async () => {
    const spy = jest.spyOn(utils, 'injectSourcemapHook');

    runProcess({ globals: { 'ts-jest': { disableSourceMapSupport: true } } });
    expect(spy).not.toHaveBeenCalled();

    spy.mockReset();
    spy.mockRestore();
  });

  it(`should be used when the disableSourceMapSupport flag is set to anything other than true`, async () => {
    const spy = jest.spyOn(utils, 'injectSourcemapHook');

    runProcess({ globals: { 'ts-jest': { disableSourceMapSupport: 'true' } } });
    expect(spy).toHaveBeenCalled();
    runProcess({ globals: { 'ts-jest': { disableSourceMapSupport: 1 } } });
    expect(spy).toHaveBeenCalled();

    spy.mockReset();
    spy.mockRestore();
  });
});

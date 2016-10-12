import { } from 'jest';
import { } from 'node';

import runJest from '../__helpers__/runJest';

describe('button', () => {

  it('should show the correct error locations in the typescript files', () => {

    const result = runJest('../button', ['--no-cache', '-u']);

    const stderr = result.stderr.toString();

    expect(result.status).toBe(1);
    expect(stderr).toContain('Button.tsx:18:23');
    expect(stderr).toContain('Button.test.tsx:15:12');

  });

});
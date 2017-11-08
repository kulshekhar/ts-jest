import runJest from '../__helpers__/runJest';
import * as React from 'react';

describe('TSX Errors', () => {
  it('should show the correct error locations in the typescript files', () => {
    const result = runJest('../button', ['--no-cache', '-u']);

    const stderr = result.stderr.toString();

    expect(result.status).toBe(1);
    expect(stderr).toContain('Button.tsx:22:17');
    expect(stderr).toContain('Button.test.tsx:16:12');
  });
});

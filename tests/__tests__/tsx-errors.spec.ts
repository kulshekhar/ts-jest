import runJest from '../__helpers__/runJest';
import * as React from 'react';

const nodeVersion = parseInt(process.version.substr(1, 2));
const reactVersion = parseInt(React.version.substr(0, 2));

const tmpDescribe =
  nodeVersion >= 8 && reactVersion >= 16 ? xdescribe : describe;

tmpDescribe('TSX Errors', () => {
  it('should show the correct error locations in the typescript files', () => {
    const result = runJest('../button', ['--no-cache', '-u']);

    const stderr = result.stderr.toString();

    expect(result.status).toBe(1);
    expect(stderr).toContain('Button.tsx:16:17');
    expect(stderr).toContain('Button.test.tsx:15:12');
  });
});

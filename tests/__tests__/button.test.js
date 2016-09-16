'use strict';

const runJest = require('../__helpers__/runJest');

describe('button', () => {

  it('should run successfully', () => {

    const result = runJest('../button', ['--no-cache', '-u']);

    const stderr = result.stderr.toString();
    const output = result.output.toString();

    expect(result.status).toBe(1);
    expect(output).toContain('1 test failed, 1 test passed (2 total in 1 test suite');
    expect(stderr).toContain('✓ Button renders correctly');
    expect(stderr).toContain('✕ BadButton should throw an error on line 11');
    expect(stderr).toContain('Button.tsx:18:23');
    expect(stderr).toContain('Button.test.tsx:15:12');

  });

});
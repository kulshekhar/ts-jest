import runJest from '../__helpers__/runJest';

describe('babelConfig flag', () => {
    
    it('should use a custom Babel config', () => {
        const result = runJest('../babel-config', ['--no-cache', '-u']);
        expect(result.status).toBe(0);
    });

    it('should fail for invalid babel configs', () => {
        const result = runJest('../babel-config-invalid', ['--no-cache', '-u']);
        const stderr = result.stderr.toString();
        expect(result.status).toBe(1);
        expect(stderr).toContain('ReferenceError: [BABEL]');
        expect(stderr).toContain('Check out http://babeljs.io/docs/usage/options/ for more information about options.');
    });
});

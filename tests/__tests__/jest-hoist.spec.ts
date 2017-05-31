import runJest from '../__helpers__/runJest';

describe('Jest.mock() calls', () => {

    it('Should run all tests using jest.mock() underneath the imports succesfully.', () => {
        const result = runJest('../hoist-test', ['--no-cache']);
        const output = result.output.toString();

        expect(output).toContain('4 passed, 4 total');
        expect(result.status).toBe(0);
    });

});

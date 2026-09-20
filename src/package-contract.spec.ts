import packageJson from '../package.json'

describe('v30 package contract', () => {
  it('should require Jest 30 peer dependencies', () => {
    expect(
      ['@jest/transform', '@jest/types', 'babel-jest', 'jest', 'jest-util'].map(
        (dependency) => packageJson.peerDependencies[dependency],
      ),
    ).toEqual(['^30.0.0', '^30.0.0', '^30.0.0', '^30.0.0', '^30.0.0'])
  })

  it('should require Node 20 or newer', () => {
    expect(packageJson.engines.node).toBe('>=20.0.0')
  })

  it('should support TypeScript 5.4 through 6.x', () => {
    expect(packageJson.peerDependencies.typescript).toBe('>=5.4 <7')
  })
})

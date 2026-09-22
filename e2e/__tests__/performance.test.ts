import { runJest } from '../run-jest'

const JEST_ARGS = ['--coverage', '--maxWorkers=3', '--silent']
const MAX_COEFFICIENT_OF_VARIATION = 0.3
const MAX_MEASUREMENT_ATTEMPTS = 2
const SAMPLE_COUNT = 3

const median = (values: number[]): number => {
  const sortedValues = [...values].sort((left, right) => left - right)
  const midpoint = Math.floor(sortedValues.length / 2)

  return sortedValues.length % 2 === 0
    ? (sortedValues[midpoint - 1] + sortedValues[midpoint]) / 2
    : sortedValues[midpoint]
}

const coefficientOfVariation = (values: number[]): number => {
  const mean = values.reduce((total, value) => total + value, 0) / values.length
  const variance = values.reduce((total, value) => total + (value - mean) ** 2, 0) / values.length

  return Math.sqrt(variance) / mean
}

const runPerformanceCase = async (configFile: string): Promise<number> => {
  const result = await runJest('performance', configFile, JEST_ARGS)

  expect(result).toMatchObject({ exitCode: 0 })

  return result.durationMs
}

const measureDurations = async (): Promise<{ compiler: number[]; transpiler: number[] }> => {
  const compiler: number[] = []
  const transpiler: number[] = []

  for (let sample = 0; sample < SAMPLE_COUNT; sample++) {
    if (sample % 2 === 0) {
      compiler.push(await runPerformanceCase('jest-compiler-cjs.config.ts'))
      transpiler.push(await runPerformanceCase('jest-transpiler-cjs.config.ts'))
    } else {
      transpiler.push(await runPerformanceCase('jest-transpiler-cjs.config.ts'))
      compiler.push(await runPerformanceCase('jest-compiler-cjs.config.ts'))
    }
  }

  return { compiler, transpiler }
}

describe('performance', () => {
  it('reports full type-checking performance metrics', async () => {
    await runPerformanceCase('jest-compiler-cjs.config.ts')
    await runPerformanceCase('jest-transpiler-cjs.config.ts')

    let durations = await measureDurations()
    let measurementAttempts = 1

    while (
      measurementAttempts < MAX_MEASUREMENT_ATTEMPTS &&
      (coefficientOfVariation(durations.compiler) > MAX_COEFFICIENT_OF_VARIATION ||
        coefficientOfVariation(durations.transpiler) > MAX_COEFFICIENT_OF_VARIATION)
    ) {
      durations = await measureDurations()
      measurementAttempts++
    }

    const compilerDurations = durations.compiler
    const transpilerDurations = durations.transpiler
    const compilerMedian = median(compilerDurations)
    const transpilerMedian = median(transpilerDurations)
    const compilerVariation = coefficientOfVariation(compilerDurations)
    const transpilerVariation = coefficientOfVariation(transpilerDurations)
    const medianRatio = compilerMedian / transpilerMedian

    console.info(
      JSON.stringify({
        compilerDurations,
        compilerMedian,
        compilerVariation,
        measurementAttempts,
        observedMedianRatio: medianRatio,
        transpilerDurations,
        transpilerMedian,
        transpilerVariation,
      }),
    )

    expect(compilerMedian).toBeGreaterThan(0)
    expect(transpilerMedian).toBeGreaterThan(0)
    expect(Number.isFinite(medianRatio)).toBe(true)
  })
})

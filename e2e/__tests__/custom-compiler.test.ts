import path from 'path'

import { json as runWithJson } from '../run-jest'
import { runNpmInstall } from '../utils'

const DIR_NAME = 'custom-compiler'

/**
 * Test disabled after typescript@5 support due to issues on ttypescript.
 * Now typescript exports module rather than object namespaces so ttypescript is not working anymore.
 * @see https://github.com/kulshekhar/ts-jest/pull/4064#issuecomment-1483937671
 *
 * Additional info can be found on the following links:
 * @see https://github.com/cevek/ttypescript/issues/140
 * @see https://github.com/microsoft/TypeScript/issues/52826
 *
 * Test can be re-enabled after the library supports typescript@5
 */
// eslint-disable-next-line jest/no-disabled-tests
describe.skip('ttypescript', () => {
  const TTS_DIR_NAME = 'ttypescript'

  beforeAll(() => {
    runNpmInstall(path.join(__dirname, '..', DIR_NAME, TTS_DIR_NAME))
  })

  test(`successfully runs the tests inside ${DIR_NAME}/${TTS_DIR_NAME}`, () => {
    const { json } = runWithJson(`${DIR_NAME}/${TTS_DIR_NAME}`)

    expect(json.success).toBe(true)
  })
})

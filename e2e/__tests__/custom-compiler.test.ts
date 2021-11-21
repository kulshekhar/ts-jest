import path from 'path'

import { json as runWithJson } from '../run-jest'
import { runNpmInstall } from '../utils'

const DIR_NAME = 'custom-compiler'

describe('ttypescript', () => {
  const TTS_DIR_NAME = 'ttypescript'

  beforeAll(() => {
    runNpmInstall(path.join(__dirname, '..', DIR_NAME, TTS_DIR_NAME))
  })

  test(`successfully runs the tests inside ${DIR_NAME}/${TTS_DIR_NAME}`, () => {
    const { json } = runWithJson(`${DIR_NAME}/${TTS_DIR_NAME}`)

    expect(json.success).toBe(true)
  })
})

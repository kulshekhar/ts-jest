import { getWinPath } from './getOsPath'

describe('getWinPath', () => {
  it('returns win32 paths on windows', () => {
    const input = `C:\\\\Users\\travis\\build\\kulshekhar\\ts-jest\\src\\config\\__helpers__\\project-1`

    expect(getWinPath(input)).toMatchInlineSnapshot(
      `"C:\\\\\\\\Users\\\\\\\\travis\\\\\\\\build\\\\\\\\kulshekhar\\\\\\\\ts-jest\\\\\\\\src\\\\\\\\config\\\\\\\\__helpers__\\\\\\\\project-1"`,
    )
  })
})

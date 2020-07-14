import { parse } from 'json5'
import { readFileSync } from 'fs'

/**
 * A fault-tolerant way to load json files, that
 * won't throw on common artifacts such as comments
 * and trailing commas.
 *
 * @param path The path of the json file to load.
 */
export const getJson = (path: string) => {
  const str = readFileSync(path, 'utf-8')

  return parse(str)
}

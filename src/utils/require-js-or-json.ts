import parseJsonUnsafe from './parse-json-unsafe'
import { readFileSync } from 'fs'

export default function requireJsOrJson(filePath: string): any {
  let res: any
  try {
    res = require(filePath)
  } catch (err) {
    res = parseJsonUnsafe(readFileSync(filePath, 'utf8'))
  }
  return res
}

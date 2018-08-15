import { createHash } from 'crypto'

// stores hashes made out of only one argument being a string
export const cache: { [key: string]: string } = Object.create(null)

type DataItem = string | Buffer

export default function sha1(...data: DataItem[]): string {
  const canCache = data.length === 1 && typeof data[0] === 'string'
  // caching
  let cacheKey!: string
  if (canCache) {
    cacheKey = data[0] as string
    if (cacheKey in cache) {
      return cache[cacheKey]
    }
  }

  // we use SHA1 because it's the fastest provided by node and we are not concerned about security
  const hash = createHash('sha1')
  data.forEach(item => hash.update(item))
  const res = hash.digest('base64').toString()

  if (canCache) {
    cache[cacheKey] = res
  }
  return res
}

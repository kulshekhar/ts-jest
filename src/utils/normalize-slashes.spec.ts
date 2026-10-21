import { expect, it } from '@jest/globals'

import { normalizeSlashes } from './normalize-slashes'

it('should replace windows slashes', () => {
  expect(normalizeSlashes('path/to\\something/here\\and\\there.js')).toBe('path/to/something/here/and/there.js')
})

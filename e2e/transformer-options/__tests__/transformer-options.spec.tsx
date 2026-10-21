import { describe, expect, it } from '@jest/globals'

import App from '../src/App'

describe('transformer-options', () => {
  it('should pass', () => {
    expect(App.prototype.render().props.defaultMessage).toBeUndefined()
  })
})

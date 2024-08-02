import App from '../src/App'

describe('transformer-options', () => {
  it('should pass', () => {
    expect(App.prototype.render().props.defaultMessage).toBeUndefined()
  })
})

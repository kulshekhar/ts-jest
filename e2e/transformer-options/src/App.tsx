import { Component } from 'react'
import { FormattedMessage } from 'react-intl'

export default class App extends Component {
  render() {
    return (
      <FormattedMessage
        id="foo.bar.baz"
        defaultMessage="Hello World! {foo, number}"
        description="The default message."
        values={{
          foo: 1,
        }}
      />
    )
  }
}

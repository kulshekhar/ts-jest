import * as React from 'react'
import { Component } from 'react'

interface ButtonProps {}

class Button extends Component<ButtonProps, void> {
  render() {
    return (
        <div className="button">{this.props.children}</div>
      )
    }
}

export default Button

import * as React from 'react';

export class Button extends React.Component {
  render() {
    return (
      <div className="button">{this.props.children}</div>
    );
  }
}

export class BadButton extends React.Component {
  render() {
    `
    
    `;
    if (1 == 1) throw new Error('Error in Bad button');
    return (
      <div className="bad-button">{this.props.children}</div>
    );
  }
}

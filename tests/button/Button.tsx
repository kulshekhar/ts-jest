import * as React from 'react';

interface ButtonProps { };

export class Button extends React.Component<ButtonProps, void>{
  render() {
    return (
      <div className="button">{this.props.children}</div>
    );
  }
}

export class BadButton extends React.Component<ButtonProps, void>{
  render() {
    `
    
    `;
    if (1 == 1) throw new Error('Error in Bad button');
    return (
      <div className="bad-button">{this.props.children}</div>
    );
  }
}
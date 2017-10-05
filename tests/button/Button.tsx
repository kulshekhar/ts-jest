import * as React from 'react';

// This interface has been put here just so that the line
// numbers in the transpiled javascript file are different
interface ButtonProps {
  someProp: any;
};

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

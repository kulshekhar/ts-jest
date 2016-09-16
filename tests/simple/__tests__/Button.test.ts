import * as React from 'react';
import * as renderer from 'react-test-renderer';
import Button from './../Button.tsx';

it('renders correctly', () => {
  console.log('Button',Button);
  const tree = renderer.create(<Button>hi!</Button>).toJSON();
  expect(tree).toMatchSnapshot()
})

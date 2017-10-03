declare var jest, describe, it, expect, require;

import * as React from 'react';
const renderer = require('react-test-renderer');

import { Button, BadButton } from '../Button';

it('Button renders correctly', () => {
  const tree = renderer.create(<Button>hi!</Button>).toJSON();
  expect(tree).toMatchSnapshot();
});

xit('BadButton should throw an error on line 18', () => {

  renderer.create(<BadButton>hi!</BadButton>).toJSON();

});

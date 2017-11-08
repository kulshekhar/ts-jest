declare var jest, describe, it, expect, require;

import * as React from 'react';
import * as testRenderer from 'react-test-renderer';
import * as ShallowRenderer from 'react-test-renderer/shallow';

import { Button, BadButton } from '../Button';

it('Button renders correctly', () => {
  const tree = testRenderer.create(<Button>hi!</Button>).toJSON();
  expect(tree).toMatchSnapshot();
});

it('BadButton should throw an error on line 22', () => {
  const renderer = new ShallowRenderer();
  renderer.render(<BadButton>hi!</BadButton>);
});

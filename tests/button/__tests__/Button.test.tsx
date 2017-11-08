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
  // We're using shallow renderer here because the behaviour of 
  // the test-renderer is causing a bug when used with React 16 & node 8
  // https://github.com/kulshekhar/ts-jest/issues/334
  const renderer = new ShallowRenderer();
  renderer.render(<BadButton>hi!</BadButton>);
});

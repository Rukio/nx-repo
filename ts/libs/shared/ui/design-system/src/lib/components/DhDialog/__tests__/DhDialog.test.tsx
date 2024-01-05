import React from 'react';
import { render } from '../../../../test-utils';

import {
  OneButton,
  TwoButton,
  ScrollingContent,
  FullScreen,
} from '../__storybook__/DhDialog.stories';

test(`should render ${OneButton.name}`, () => {
  const { baseElement } = render(<OneButton />);
  expect(baseElement).toMatchSnapshot();
});

test(`should render ${TwoButton.name}`, () => {
  const { baseElement } = render(<TwoButton />);
  expect(baseElement).toMatchSnapshot();
});

test(`should render ${ScrollingContent.name}`, () => {
  const { baseElement } = render(<ScrollingContent />);
  expect(baseElement).toMatchSnapshot();
});

test(`should render ${FullScreen.name}`, () => {
  const { baseElement } = render(<FullScreen />);
  expect(baseElement).toMatchSnapshot();
});

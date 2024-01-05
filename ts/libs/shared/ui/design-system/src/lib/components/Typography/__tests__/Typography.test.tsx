import { render } from '../../../../test-utils';

import { Default, Variants } from '../__storybook__/Typography.stories';

test('Default should render', () => {
  const { asFragment } = render(<Default />);
  expect(asFragment()).toMatchSnapshot();
});

test('Variants should render', () => {
  const { asFragment } = render(<Variants />);
  expect(asFragment()).toMatchSnapshot();
});

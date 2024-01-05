import { render } from '../../../../test-utils';

import { AllIcons } from '../__storybook__/AllIcons.stories';

test('should render', () => {
  const { asFragment } = render(<AllIcons />);
  expect(asFragment()).toMatchSnapshot();
});

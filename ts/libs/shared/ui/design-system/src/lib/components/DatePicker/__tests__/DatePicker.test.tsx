import { render } from '../../../../test-utils';

import { Basic } from '../__storybook__/DatePicker.stories';

test('should render', () => {
  const { asFragment } = render(<Basic />);
  expect(asFragment()).toMatchSnapshot();
});

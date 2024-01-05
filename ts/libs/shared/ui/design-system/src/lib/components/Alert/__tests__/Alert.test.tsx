import { render } from '../../../../test-utils';

import {
  Basic,
  BasicWithComponentMessage,
  Filled,
  Outlined,
  Severity,
} from '../__storybook__/Alert.stories';

test('should render all components', () => {
  const { asFragment } = render(
    <>
      <Basic />
      <Severity />
      <Outlined />
      <Filled />
      <BasicWithComponentMessage />
    </>
  );
  expect(asFragment()).toMatchSnapshot();
});

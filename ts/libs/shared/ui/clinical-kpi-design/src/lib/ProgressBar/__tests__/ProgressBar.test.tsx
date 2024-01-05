import { render } from '../../../testUtils/test-utils';
import {
  BasicProgressBar,
  NoTextProgressBar,
} from '../__storybook__/ProgressBar.stories';

describe('Snapshot tests', () => {
  test('should render BasicProgressBar', () => {
    const { asFragment } = render(<BasicProgressBar />);
    expect(asFragment()).toMatchSnapshot();
  });

  test('should render NoTextProgressBar', () => {
    const { asFragment } = render(<NoTextProgressBar />);
    expect(asFragment()).toMatchSnapshot();
  });
});

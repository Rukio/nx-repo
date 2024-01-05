import { render } from '../../../../../test-utils';
import EmptyNoteMessage from './EmptyNoteMessage';

describe('EmptyNoteMessage', () => {
  test('should render snapshot correctly', () => {
    const { asFragment } = render(<EmptyNoteMessage />);
    expect(asFragment()).toMatchSnapshot();
  });
});

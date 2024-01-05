import { render, screen } from '../../../testUtils';
import { DEFAULT_ERROR_ALERT_TEXT } from '../../constants';
import DefaultAlert from './DefaultAlert';

describe('DefaultAlert', () => {
  it('should render correctly', () => {
    const testId = 'default-alert';
    const { container } = render(<DefaultAlert dataTestId={testId} />);
    const alert = screen.getByTestId(testId);

    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent(DEFAULT_ERROR_ALERT_TEXT);
    expect(container).toMatchSnapshot();
  });
});

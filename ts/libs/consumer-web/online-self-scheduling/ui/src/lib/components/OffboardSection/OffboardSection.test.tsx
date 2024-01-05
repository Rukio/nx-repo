import { render, screen, exactRegexMatch } from '../../../testUtils';
import { OffboardSection, OffboardSectionProps } from './OffboardSection';
import { OFFBOARD_SECTION_TEST_IDS } from './testIds';

const defaultProps: OffboardSectionProps = {
  title:
    'We apologize, we don’t have an appropriate team available to care for you today.',
  message:
    'We encourage you to call your primary care provider or seek care at a facility.',
};

const setup = (props: Partial<OffboardSectionProps> = {}) =>
  render(<OffboardSection {...defaultProps} {...props} />);

describe('<OffboardSection />', () => {
  it('should render offboard section with passed title and message', () => {
    setup();

    const root = screen.getByTestId(OFFBOARD_SECTION_TEST_IDS.ROOT);
    expect(root).toBeVisible();

    const title = screen.getByTestId(OFFBOARD_SECTION_TEST_IDS.TITLE);
    expect(title).toBeVisible();
    expect(title).toHaveTextContent(exactRegexMatch(defaultProps.title));

    const message = screen.getByTestId(OFFBOARD_SECTION_TEST_IDS.MESSAGE);
    expect(message).toBeVisible();
    expect(message).toHaveTextContent(exactRegexMatch(defaultProps.message));
  });
});

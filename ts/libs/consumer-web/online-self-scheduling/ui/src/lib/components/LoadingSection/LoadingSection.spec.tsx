import { render, screen } from '../../../testUtils';
import { LOADING_SECTION_TEST_IDS } from './testIds';
import LoadingSection, { LoadingSectionProps } from './LoadingSection';

const defaultProps: LoadingSectionProps = {
  title: 'Finding your care team',
  subtitle:
    'Based on your details, we’re finding the best medical team to come to you.',
};

const getSubTitle = () => screen.getByTestId(LOADING_SECTION_TEST_IDS.SUBTITLE);

const setup = (props: Partial<LoadingSectionProps> = {}) =>
  render(<LoadingSection {...defaultProps} {...props} />);

describe('<LoadingSection />', () => {
  it('should render LoadingSection', () => {
    setup();

    const subtitle = getSubTitle();
    expect(subtitle).toBeVisible();
    expect(subtitle).toHaveTextContent(defaultProps.subtitle);
  });
});

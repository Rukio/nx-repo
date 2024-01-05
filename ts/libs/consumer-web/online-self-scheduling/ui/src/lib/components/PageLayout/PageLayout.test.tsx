import { render, screen } from '../../../testUtils';
import PageLayout, { PageLayoutProps } from './PageLayout';
import { PAGE_LAYOUT_TEST_IDS } from './testIds';

const fakeChildrenTestId = 'fake-children';
const fakeChildren = <div data-testid={fakeChildrenTestId} />;

const defaultProps: PageLayoutProps = { children: fakeChildren };

const setup = (props: Partial<PageLayoutProps> = {}) =>
  render(<PageLayout {...defaultProps} {...props} />, { withRouter: true });

describe('PageLayout', () => {
  it('should render correctly with children only', () => {
    setup();

    const requestProgressBar = screen.queryByTestId(
      PAGE_LAYOUT_TEST_IDS.REQUEST_PROGRESS_BAR
    );
    expect(requestProgressBar).not.toBeInTheDocument();

    const backButton = screen.queryByTestId(PAGE_LAYOUT_TEST_IDS.BACK_BUTTON);
    expect(backButton).not.toBeInTheDocument();

    const children = screen.getByTestId(fakeChildrenTestId);
    expect(children).toBeVisible();
  });

  it('should render the progress bar correctly', () => {
    const mockStepProgress = 10;
    setup({
      stepProgress: mockStepProgress,
    });

    const requestProgressBar = screen.getByTestId(
      PAGE_LAYOUT_TEST_IDS.REQUEST_PROGRESS_BAR
    );
    expect(requestProgressBar).toBeVisible();
    expect(requestProgressBar).toHaveAttribute(
      'aria-valuenow',
      mockStepProgress.toString()
    );
  });

  it('should render the back link', () => {
    const mockBackButtonOptions: PageLayoutProps['backButtonOptions'] = {
      text: 'Back button text',
      link: '/',
    };
    setup({ backButtonOptions: mockBackButtonOptions });

    const backButton = screen.getByTestId(PAGE_LAYOUT_TEST_IDS.BACK_BUTTON);
    expect(backButton).toBeVisible();
    expect(backButton).toHaveTextContent(mockBackButtonOptions.text);
    expect(backButton).toHaveAttribute('href', mockBackButtonOptions.link);
  });

  it('should render the message section if message is passed', () => {
    const mockMessage = 'Page Layout Message';
    const mockMessageTestId = 'mock-message';
    const mockMessageSection: PageLayoutProps['message'] = (
      <div data-testid={mockMessageTestId}>{mockMessage}</div>
    );
    setup({ message: mockMessageSection });

    const messageSection = screen.getByTestId(
      PAGE_LAYOUT_TEST_IDS.MESSAGE_SECTION
    );
    expect(messageSection).toBeVisible();

    const message = screen.getByTestId(mockMessageTestId);
    expect(message).toBeVisible();
    expect(message).toHaveTextContent(mockMessage);
  });

  it('should render loader correctly', () => {
    setup({ isLoading: true });

    const loader = screen.getByTestId(PAGE_LAYOUT_TEST_IDS.LOADER);
    expect(loader).toBeVisible();

    const children = screen.queryByTestId(fakeChildrenTestId);
    expect(children).not.toBeInTheDocument();
  });
});

import { render, screen } from '../../../testUtils';
import PageSection, { PageSectionProps } from './PageSection';
import { PAGE_SECTION_TEST_IDS } from './testIds';

const fakeChildrenTestId = 'fake-children';

const fakeChildren = <div data-testid={fakeChildrenTestId} />;

const MOCK_TEST_ID_PREFIX = 'test-id-prefix';

const defaultProps: PageSectionProps = {
  children: fakeChildren,
  testIdPrefix: MOCK_TEST_ID_PREFIX,
};

const setup = (props: Partial<PageSectionProps> = {}) =>
  render(<PageSection {...defaultProps} {...props} />, { withRouter: true });

describe('<PageSection />', () => {
  it('should render correctly with children only', () => {
    setup();

    const backButton = screen.queryByTestId(
      PAGE_SECTION_TEST_IDS.getPageSectionBackButtonTestId(MOCK_TEST_ID_PREFIX)
    );

    const pageTitle = screen.queryByTestId(
      PAGE_SECTION_TEST_IDS.getPageSectionTitleTestId(MOCK_TEST_ID_PREFIX)
    );

    const pageSubtitle = screen.queryByTestId(
      PAGE_SECTION_TEST_IDS.getPageSectionSubtitleTestId(MOCK_TEST_ID_PREFIX)
    );

    expect(backButton).not.toBeInTheDocument();
    expect(pageTitle).not.toBeInTheDocument();
    expect(pageSubtitle).not.toBeInTheDocument();

    const children = screen.getByTestId(fakeChildrenTestId);
    expect(children).toBeVisible();
  });

  it('should render the back link', () => {
    const mockBackButtonOptions: PageSectionProps['backButtonOptions'] = {
      text: 'Back button text',
      link: '/',
    };
    setup({ backButtonOptions: mockBackButtonOptions });

    const backButton = screen.getByTestId(
      PAGE_SECTION_TEST_IDS.getPageSectionBackButtonTestId(MOCK_TEST_ID_PREFIX)
    );
    expect(backButton).toBeVisible();
    expect(backButton).toHaveTextContent(mockBackButtonOptions.text);
    expect(backButton).toHaveAttribute('href', mockBackButtonOptions.link);
  });

  it('should render title', () => {
    const mockTitle = 'Page title';
    setup({ title: mockTitle });

    const pageTitle = screen.getByTestId(
      PAGE_SECTION_TEST_IDS.getPageSectionTitleTestId(MOCK_TEST_ID_PREFIX)
    );
    expect(pageTitle).toBeVisible();
    expect(pageTitle).toHaveTextContent(mockTitle);
  });

  it('should render subtitle', () => {
    const mockSubtitle = 'Page subtitle';
    setup({ subtitle: mockSubtitle });

    const pageSubtitle = screen.getByTestId(
      PAGE_SECTION_TEST_IDS.getPageSectionSubtitleTestId(MOCK_TEST_ID_PREFIX)
    );
    expect(pageSubtitle).toBeVisible();
    expect(pageSubtitle).toHaveTextContent(mockSubtitle);
  });
});

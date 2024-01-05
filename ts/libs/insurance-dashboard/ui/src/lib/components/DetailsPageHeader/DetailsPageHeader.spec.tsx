import { render, screen } from '../../../testUtils';
import DetailsPageHeader from './DetailsPageHeader';
import { DETAILS_PAGE_HEADER_TEST_IDS } from './testIds';

const mockedProps = {
  title: 'Awesome title',
  onGoBack: vi.fn(),
};

const setup = () => {
  const getBackButton = () =>
    screen.getByTestId(DETAILS_PAGE_HEADER_TEST_IDS.BACK_BUTTON);
  const getTitle = () => screen.getByTestId(DETAILS_PAGE_HEADER_TEST_IDS.TITLE);

  return {
    ...render(<DetailsPageHeader {...mockedProps} />),
    getBackButton,
    getTitle,
  };
};

describe('<DetailsPageHeader />', () => {
  it('should render properly', () => {
    const { getTitle, getBackButton } = setup();

    const button = getBackButton();
    const title = getTitle();

    expect(button).toHaveTextContent('Back');
    expect(title).toHaveTextContent(mockedProps.title);
  });

  it('should call go back', async () => {
    const { getBackButton, user } = setup();

    const backButton = getBackButton();
    await user.click(backButton);

    expect(mockedProps.onGoBack).toBeCalledTimes(1);
  });
});

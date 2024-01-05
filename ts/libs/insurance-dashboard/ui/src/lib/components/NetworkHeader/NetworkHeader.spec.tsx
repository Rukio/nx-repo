import { render, screen } from '../../../testUtils';
import NetworkHeader from './NetworkHeader';
import { NETWORK_HEADER_TEST_IDS } from './testIds';

const onBackClick = vi.fn();
const mockedInsurancePayerName = 'Awesome Payer';
const mockedInsuranceNetworkName = 'Awesome Network';

const setup = () =>
  render(
    <NetworkHeader
      title={mockedInsuranceNetworkName}
      buttonTitle={mockedInsurancePayerName}
      onClick={onBackClick}
    />
  );

describe('<NetworkHeader />', () => {
  it('should render properly', () => {
    setup();
    const headerTitle = screen.getByTestId(
      NETWORK_HEADER_TEST_IDS.HEADER_TITLE
    );
    expect(headerTitle).toBeVisible();
    expect(headerTitle).toHaveTextContent(mockedInsuranceNetworkName);

    const backButton = screen.getByTestId(NETWORK_HEADER_TEST_IDS.BACK_BUTTON);
    expect(backButton).toBeVisible();
    expect(backButton).toHaveTextContent(mockedInsurancePayerName);
  });

  it('back button should be clickable', async () => {
    const { user } = setup();
    const button = screen.getByTestId(NETWORK_HEADER_TEST_IDS.BACK_BUTTON);
    expect(button).toBeVisible();
    expect(button).toBeEnabled();
    await user.click(button);
    expect(onBackClick).toHaveBeenCalled();
  });
});

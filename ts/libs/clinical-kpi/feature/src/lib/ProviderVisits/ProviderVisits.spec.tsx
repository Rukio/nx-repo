import {
  interceptQuery,
  renderWithUserProvider,
  screen,
} from '../util/testUtils';
import ProviderVisits from './ProviderVisits';
import { PROVIDER_VISITS_TEST_IDS } from './testIds';
import { PROVIDER_VISITS_TABLE_TEST_IDS } from './components/ProviderVisitsTable/testIds';
import { LEADS_PROVIDER_VISITS_INTERCEPT_URL } from '../util/testUtils/server/handlers';

const providerId = '116600';

const setup = () => {
  return renderWithUserProvider(<ProviderVisits providerId={providerId} />);
};

describe('<ProviderVisits />', () => {
  it('should render correctly', async () => {
    setup();
    const header = await screen.findByTestId(PROVIDER_VISITS_TEST_IDS.HEADER);
    expect(header).toBeVisible();
    const pagination = await screen.findByTestId(
      PROVIDER_VISITS_TEST_IDS.PAGINATION
    );
    expect(pagination).toBeVisible();
    const table = await screen.findByTestId(
      PROVIDER_VISITS_TABLE_TEST_IDS.TABLE
    );
    expect(table).toBeVisible();
  });

  it('should render correctly active chip after click', async () => {
    const { container, user } = setup();
    const header = await screen.findByTestId(PROVIDER_VISITS_TEST_IDS.HEADER);
    expect(header).toBeVisible();

    const filterAbx = screen.getByTestId(PROVIDER_VISITS_TEST_IDS.FILTER_ABX);
    await user.click(filterAbx);

    const filterEscalated = screen.getByTestId(
      PROVIDER_VISITS_TEST_IDS.FILTER_ESCALATED
    );
    await user.click(filterEscalated);

    expect(container).toMatchSnapshot();
  });

  it('should render alert correctly', async () => {
    interceptQuery({
      url: LEADS_PROVIDER_VISITS_INTERCEPT_URL,
      data: null,
    });

    setup();
    const alert = await screen.findByTestId(
      PROVIDER_VISITS_TEST_IDS.DEFAULT_ERROR_ALERT
    );
    expect(alert).toBeVisible();
  });
});

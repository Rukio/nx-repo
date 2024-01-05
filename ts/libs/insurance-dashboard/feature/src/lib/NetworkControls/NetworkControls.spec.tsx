import { render, screen, renderForReadOnlyRole } from '../../testUtils';
import NetworkControls from './NetworkControls';
import { INSURANCE_DASHBOARD_ROUTES } from '../constants';
import { PAYERS_NETWORKS_TEST_IDS } from './testIds';

const mockedInsurancePayerId = '1';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );

  return {
    ...actual,
    useParams: vi.fn(() => ({ payerId: mockedInsurancePayerId })),
  };
});

describe('<NetworkControls />', () => {
  it('should render properly', () => {
    render(<NetworkControls />);

    const buttonAddNetwork = screen.getByTestId(
      PAYERS_NETWORKS_TEST_IDS.ADD_NETWORK_BUTTON
    );

    expect(buttonAddNetwork).toBeVisible();
    expect(buttonAddNetwork).toHaveTextContent('Add Network');
  });

  it('should change route on "add network" button click', async () => {
    const { user } = render(<NetworkControls />);

    const buttonAddNetwork = screen.getByTestId(
      PAYERS_NETWORKS_TEST_IDS.ADD_NETWORK_BUTTON
    );

    await user.click(buttonAddNetwork);

    expect(buttonAddNetwork).toHaveAttribute(
      'href',
      INSURANCE_DASHBOARD_ROUTES.getPayerNetworksCreatePath(
        mockedInsurancePayerId
      )
    );
  });

  it('should render properly for read only role', () => {
    renderForReadOnlyRole(<NetworkControls />);

    const buttonAddNetwork = screen.getByTestId(
      PAYERS_NETWORKS_TEST_IDS.ADD_NETWORK_BUTTON
    );

    expect(buttonAddNetwork).toBeVisible();
    expect(buttonAddNetwork).toHaveAttribute('aria-disabled', 'true');
  });
});

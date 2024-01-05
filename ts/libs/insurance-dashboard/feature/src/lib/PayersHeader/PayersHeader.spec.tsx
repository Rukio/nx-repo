import { render, screen, renderForReadOnlyRole } from '../../testUtils';
import PayersHeader from './PayersHeader';
import { PAYERS_HEADER_TEST_IDS } from '@*company-data-covered*/insurance/ui';
import { INSURANCE_DASHBOARD_ROUTES } from '../constants';

const mockedNavigator = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );

  return {
    ...actual,
    useNavigate: () => mockedNavigator,
  };
});

describe('<PayersHeader />', () => {
  it('should render properly', () => {
    render(<PayersHeader />);

    expect(screen.getByText('Insurance Payers')).toBeVisible();
    expect(screen.getByText('Add Insurance Payer')).toBeVisible();
  });

  it('should navigate to create page', async () => {
    const { user } = render(<PayersHeader />);
    const buttonAddPayer = screen.getByTestId(
      PAYERS_HEADER_TEST_IDS.ADD_PAYER_BUTTON
    );
    await user.click(buttonAddPayer);
    expect(mockedNavigator).toBeCalledWith(
      INSURANCE_DASHBOARD_ROUTES.PAYER_CREATE
    );
  });

  it('should render for view only role', async () => {
    renderForReadOnlyRole(<PayersHeader />);
    const buttonAddPayer = screen.getByTestId(
      PAYERS_HEADER_TEST_IDS.ADD_PAYER_BUTTON
    );

    expect(buttonAddPayer).toBeVisible();
    expect(buttonAddPayer).toBeDisabled();
  });
});

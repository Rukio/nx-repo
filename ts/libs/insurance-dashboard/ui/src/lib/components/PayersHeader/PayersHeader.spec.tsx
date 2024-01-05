import { render, screen } from '../../../testUtils';
import PayersHeader, { PayersHeaderProps } from './PayersHeader';
import { PAYERS_HEADER_TEST_IDS } from './testIds';

const onAddInsurancePayerClick = vi.fn();

const defaultProps: PayersHeaderProps = {
  title: 'Insurance Payers',
  buttonText: 'Add Insurance Payer',
  onAddInsurancePayer: onAddInsurancePayerClick,
  disabled: false,
};

const setup = (overrideProps: Partial<PayersHeaderProps> = {}) => {
  return render(<PayersHeader {...{ ...defaultProps, ...overrideProps }} />);
};

describe('<PayersHeader />', () => {
  it('should render properly', () => {
    setup();
    const title = screen.getByTestId(PAYERS_HEADER_TEST_IDS.TITLE);
    expect(title).toBeVisible();
    expect(title).toHaveTextContent('Insurance Payers');
    const buttonAddPayer = screen.getByTestId(
      PAYERS_HEADER_TEST_IDS.ADD_PAYER_BUTTON
    );
    expect(buttonAddPayer).toBeVisible();
    expect(buttonAddPayer).toHaveTextContent('Add Insurance Payer');
  });

  it('add insurance payer button should be clickable', async () => {
    const { user } = setup();
    const buttonAddPayer = screen.getByTestId(
      PAYERS_HEADER_TEST_IDS.ADD_PAYER_BUTTON
    );

    expect(buttonAddPayer).toBeEnabled();
    await user.click(buttonAddPayer);
    expect(onAddInsurancePayerClick).toHaveBeenCalled();
  });

  it('should render disabled header', () => {
    setup({ disabled: true });
    const title = screen.getByTestId(PAYERS_HEADER_TEST_IDS.TITLE);
    expect(title).toBeVisible();
    expect(title).toHaveTextContent('Insurance Payers');
    const buttonAddPayer = screen.getByTestId(
      PAYERS_HEADER_TEST_IDS.ADD_PAYER_BUTTON
    );
    expect(buttonAddPayer).toBeVisible();
    expect(buttonAddPayer).toHaveTextContent('Add Insurance Payer');
    expect(buttonAddPayer).toBeDisabled();
  });
});

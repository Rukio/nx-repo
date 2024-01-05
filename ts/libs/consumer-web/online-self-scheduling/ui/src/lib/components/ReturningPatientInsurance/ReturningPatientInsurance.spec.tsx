import { render, screen } from '../../../testUtils';
import {
  ReturningPatientInsurance,
  ReturningPatientInsuranceProps,
} from './ReturningPatientInsurance';
import { RETURNING_PATIENT_INSURANCE_TEST_IDS } from './testIds';

const defaultProps: Required<ReturningPatientInsuranceProps> = {
  returningPatientInsuranceTitle: 'Do you have the same primary insurance?',
  onClickInsuranceIsSameButton: jest.fn(),
  onClickInsuranceHasChangedButton: jest.fn(),
};

const getTitle = () =>
  screen.getByTestId(RETURNING_PATIENT_INSURANCE_TEST_IDS.TITLE);
const getSubtitle = () =>
  screen.getByTestId(RETURNING_PATIENT_INSURANCE_TEST_IDS.SUBTITLE);
const getInsuranceIsSameButton = () =>
  screen.getByTestId(
    RETURNING_PATIENT_INSURANCE_TEST_IDS.INSURANCE_IS_SAME_BUTTON
  );
const getInsuranceHasChangedButton = () =>
  screen.getByTestId(
    RETURNING_PATIENT_INSURANCE_TEST_IDS.INSURANCE_HAS_CHANGED_BUTTON
  );

const setup = (props: Partial<ReturningPatientInsuranceProps> = {}) =>
  render(<ReturningPatientInsurance {...defaultProps} {...props} />);

describe('<ReturningPatientInsurance />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    setup();

    const title = getTitle();
    expect(title).toBeVisible();
    expect(title).toHaveTextContent(
      defaultProps.returningPatientInsuranceTitle
    );

    const subtitle = getSubtitle();
    expect(subtitle).toBeVisible();
    expect(subtitle).toHaveTextContent(
      'Is the insurance we have on file for you correct?'
    );

    const insuranceIsSameButton = getInsuranceIsSameButton();
    expect(insuranceIsSameButton).toBeVisible();
    expect(insuranceIsSameButton).toBeEnabled();
    expect(insuranceIsSameButton).toHaveTextContent(
      'Yes, my insurance is the same'
    );

    const insuranceHasChangedButton = getInsuranceHasChangedButton();
    expect(insuranceHasChangedButton).toBeVisible();
    expect(insuranceHasChangedButton).toBeEnabled();
    expect(insuranceHasChangedButton).toHaveTextContent(
      'No, my insurance has changed'
    );
  });

  it('should call onClickInsuranceIsSameButton once insurance is same button clicked', async () => {
    const { user } = setup();

    const insuranceIsSameButton = getInsuranceIsSameButton();
    expect(insuranceIsSameButton).toBeVisible();
    expect(insuranceIsSameButton).toBeEnabled();

    await user.click(insuranceIsSameButton);

    expect(defaultProps.onClickInsuranceIsSameButton).toBeCalledTimes(1);
  });

  it('should call onClickInsuranceHasChangedButton once insurance has changed button clicked', async () => {
    const { user } = setup();

    const insuranceHasChangedButton = getInsuranceHasChangedButton();
    expect(insuranceHasChangedButton).toBeVisible();
    expect(insuranceHasChangedButton).toBeEnabled();

    await user.click(insuranceHasChangedButton);

    expect(defaultProps.onClickInsuranceHasChangedButton).toBeCalledTimes(1);
  });
});

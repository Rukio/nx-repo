import { render, screen } from '../../../testUtils';
import Confirmation, { ConfirmationProps } from './Confirmation';
import { CONFIRMATION_TEST_IDS } from './testIds';

const defaultProps: ConfirmationProps = {
  testIdPrefix: 'delete-confirmation',
  alertMessage: 'Are you sure you want to delete this?',
  buttonText: 'Delete',
  handleSubmit: vi.fn(),
};

const setup = (props?: Partial<ConfirmationProps>) => {
  return render(<Confirmation {...defaultProps} {...props} />);
};

describe('<Confirmation />', () => {
  it('should render correctly', () => {
    setup();

    const confirmationContainer = screen.getByTestId(
      CONFIRMATION_TEST_IDS.getConfirmationContainerTestId(
        defaultProps.testIdPrefix
      )
    );

    const alert = screen.getByTestId(
      CONFIRMATION_TEST_IDS.getConfirmationAlertTestId(
        defaultProps.testIdPrefix
      )
    );

    const confirmationButton = screen.getByTestId(
      CONFIRMATION_TEST_IDS.getConfirmationButtonTestId(
        defaultProps.testIdPrefix
      )
    );

    expect(confirmationContainer).toBeVisible();

    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent(defaultProps.alertMessage);

    expect(confirmationButton).toBeVisible();
    expect(confirmationButton).toHaveTextContent(defaultProps.buttonText);
  });

  it('should call handleSubmit when click on confirmation button', async () => {
    const { user } = setup();

    const confirmationButton = screen.getByTestId(
      CONFIRMATION_TEST_IDS.getConfirmationButtonTestId(
        defaultProps.testIdPrefix
      )
    );

    await user.click(confirmationButton);

    expect(defaultProps.handleSubmit).toBeCalled();
  });
});

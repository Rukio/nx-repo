import { render, screen } from '../../../testUtils';
import PhoneNumberInput, { PhoneNumberInputProps } from './PhoneNumberInput';
import { PHONE_NUMBER_INPUT_TEST_IDS } from './testids';

const defaultProps: PhoneNumberInputProps = {
  label: 'Phone Number Custom Label',
  name: 'phone',
  value: '9876543212',
  onChangeField: jest.fn(),
  inputTestIdPrefix: 'input',
};

function setup(props: Partial<PhoneNumberInputProps> = {}) {
  const { user, ...wrapper } = render(
    <PhoneNumberInput {...defaultProps} {...props} />
  );

  const getContainer = () =>
    screen.getByTestId(PHONE_NUMBER_INPUT_TEST_IDS.CONTAINER);

  const getInput = () =>
    screen.getByTestId(
      `${PHONE_NUMBER_INPUT_TEST_IDS.CONTAINER}-${defaultProps.inputTestIdPrefix}`
    );

  return {
    user,
    ...wrapper,
    getContainer,
    getInput,
  };
}

describe('<PhoneNumberInput />', () => {
  it('should render PhoneNumberInput correctly', () => {
    const { getContainer } = setup();
    const container = getContainer();
    expect(container).toBeVisible();
    expect(container).toHaveTextContent('Custom Label');
  });

  it('should render PhoneNumberInput correctly with default values of optional props', () => {
    const { getContainer } = setup({
      label: undefined,
      name: undefined,
      onChangeField: undefined,
    });
    const container = getContainer();
    expect(container).toBeVisible();
    expect(container).toHaveTextContent('Phone Number');
  });

  it('should render PhoneNumberInput correctly with disabled input', () => {
    const { getInput } = setup({
      disabled: true,
    });
    const input = getInput();
    expect(input).toBeVisible();
    expect(input).toBeDisabled();
  });

  it('should show correct value', async () => {
    setup();
    const requesterPhoneNumberInput = screen.getByTestId(
      `${PHONE_NUMBER_INPUT_TEST_IDS.CONTAINER}-${defaultProps.inputTestIdPrefix}`
    );
    expect(requesterPhoneNumberInput).toHaveValue('(987) 654-3212');
  });

  it('should show correct value with mask', async () => {
    const propsWithEmptyValue = { value: '' };
    const { user } = setup(propsWithEmptyValue);
    const requesterPhoneNumberInput = screen.getByTestId(
      `${PHONE_NUMBER_INPUT_TEST_IDS.CONTAINER}-${defaultProps.inputTestIdPrefix}`
    );
    await user.type(requesterPhoneNumberInput, '9876543');
    expect(requesterPhoneNumberInput).toHaveValue('(987) 654-3___');
  });
});

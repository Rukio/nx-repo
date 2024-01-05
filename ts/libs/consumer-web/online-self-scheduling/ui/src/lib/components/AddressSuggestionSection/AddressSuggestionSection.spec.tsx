import { render, screen } from '../../../testUtils';
import {
  AddressSuggestionSection,
  AddressSuggestionSectionProps,
} from './AddressSuggestionSection';
import { ADDRESS_SUGGESTION_SECTION_TEST_IDS } from './testIds';

const defaultProps: AddressSuggestionSectionProps = {
  isAutocorrectedResponseButtonLoading: false,
  validatedAddress: '5830 Elliot Avenue APT 202 Denver, Colorado 80205-3316',
  onClickValidatedAddress: jest.fn(),
  enteredAddress: '5830 Elliot Ave #202 Denver, Colorado 80205',
  onClickEnteredAddress: jest.fn(),
};

const setup = (props: Partial<AddressSuggestionSectionProps> = {}) =>
  render(<AddressSuggestionSection {...defaultProps} {...props} />);

describe('<AddressSuggestionSection />', () => {
  it('should render correctly', () => {
    setup();

    const root = screen.getByTestId(ADDRESS_SUGGESTION_SECTION_TEST_IDS.ROOT);
    expect(root).toBeVisible();

    const title = screen.getByTestId(ADDRESS_SUGGESTION_SECTION_TEST_IDS.TITLE);
    expect(title).toBeVisible();
    expect(title).toHaveTextContent('Verify your address');

    const subtitle = screen.getByTestId(
      ADDRESS_SUGGESTION_SECTION_TEST_IDS.SUBTITLE
    );
    expect(subtitle).toBeVisible();
    expect(subtitle).toHaveTextContent(
      'We found a validated address based on the information you entered. Is this correct?'
    );

    const validatedAddressLabel = screen.getByTestId(
      ADDRESS_SUGGESTION_SECTION_TEST_IDS.VALIDATED_ADDRESS_LABEL
    );
    expect(validatedAddressLabel).toBeVisible();
    expect(validatedAddressLabel).toHaveTextContent('Validated address');

    const validatedAddressText = screen.getByTestId(
      ADDRESS_SUGGESTION_SECTION_TEST_IDS.VALIDATED_ADDRESS_TEXT
    );
    expect(validatedAddressText).toBeVisible();
    expect(validatedAddressText).toHaveTextContent(
      defaultProps.validatedAddress
    );

    const validatedAddressButton = screen.getByTestId(
      ADDRESS_SUGGESTION_SECTION_TEST_IDS.VALIDATED_ADDRESS_BUTTON
    );
    expect(validatedAddressButton).toBeVisible();
    expect(validatedAddressButton).toHaveTextContent(
      'Use Autocorrected Response'
    );

    const enteredAddressLabel = screen.getByTestId(
      ADDRESS_SUGGESTION_SECTION_TEST_IDS.ENTERED_ADDRESS_LABEL
    );
    expect(enteredAddressLabel).toBeVisible();
    expect(enteredAddressLabel).toHaveTextContent('You entered');

    const enteredAddressText = screen.getByTestId(
      ADDRESS_SUGGESTION_SECTION_TEST_IDS.ENTERED_ADDRESS_TEXT
    );
    expect(enteredAddressText).toBeVisible();
    expect(enteredAddressText).toHaveTextContent(defaultProps.enteredAddress);

    const enteredAddressButton = screen.getByTestId(
      ADDRESS_SUGGESTION_SECTION_TEST_IDS.ENTERED_ADDRESS_BUTTON
    );
    expect(enteredAddressButton).toBeVisible();
    expect(enteredAddressButton).toHaveTextContent('Edit Address');
  });

  it('should call onClickValidatedAddress once "Use Autocorrected Response" button clicked', async () => {
    const { user } = setup();

    const validatedAddressButton = screen.getByTestId(
      ADDRESS_SUGGESTION_SECTION_TEST_IDS.VALIDATED_ADDRESS_BUTTON
    );
    expect(validatedAddressButton).toBeVisible();

    await user.click(validatedAddressButton);

    expect(defaultProps.onClickValidatedAddress).toBeCalledTimes(1);
  });

  it('should call onClickEnteredAddress once "Edit Address" button clicked', async () => {
    const { user } = setup();

    const enteredAddressButton = screen.getByTestId(
      ADDRESS_SUGGESTION_SECTION_TEST_IDS.ENTERED_ADDRESS_BUTTON
    );
    expect(enteredAddressButton).toBeVisible();

    await user.click(enteredAddressButton);

    expect(defaultProps.onClickEnteredAddress).toBeCalledTimes(1);
  });

  it('buttons should be disabled if the patient is loading', () => {
    setup({
      isAutocorrectedResponseButtonLoading: true,
    });

    const validatedAddressButton = screen.getByTestId(
      ADDRESS_SUGGESTION_SECTION_TEST_IDS.VALIDATED_ADDRESS_BUTTON
    );
    expect(validatedAddressButton).toBeDisabled();

    const editAddressButton = screen.getByTestId(
      ADDRESS_SUGGESTION_SECTION_TEST_IDS.ENTERED_ADDRESS_BUTTON
    );
    expect(editAddressButton).toBeDisabled();
  });
});

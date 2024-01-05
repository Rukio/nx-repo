import { useForm } from 'react-hook-form';
import { render, renderHook, screen, within } from '../../../testUtils';
import AddressForm, { AddressFormProps } from './AddressForm';
import { ADDRESS_FORM_TEST_IDS } from './testIds';
import { AddressPayload } from '../../types';
import { STATES } from '../../states';

const defaultProps: Omit<AddressFormProps, 'control'> = {
  testIdPrefix: 'test',
};

const setup = () => {
  const { result } = renderHook(() =>
    useForm<AddressPayload>({
      defaultValues: {
        streetAddress1: '',
        streetAddress2: '',
        locationDetails: '',
        city: '',
        state: '',
        zipCode: '',
      },
    })
  );

  return render(
    <AddressForm {...defaultProps} control={result.current.control} />,
    { withRouter: true }
  );
};

describe('<AddressForm />', () => {
  it('should render correctly', async () => {
    const { user } = setup();

    expect(
      screen.getByTestId(
        ADDRESS_FORM_TEST_IDS.getStreetAddress1InputTestId(
          defaultProps.testIdPrefix
        )
      )
    ).toBeVisible();

    expect(
      screen.getByTestId(
        ADDRESS_FORM_TEST_IDS.getStreetAddress2InputTestId(
          defaultProps.testIdPrefix
        )
      )
    ).toBeVisible();

    expect(
      screen.getByTestId(
        ADDRESS_FORM_TEST_IDS.getZipCodeInputTestId(defaultProps.testIdPrefix)
      )
    ).toBeVisible();

    expect(
      screen.getByTestId(
        ADDRESS_FORM_TEST_IDS.getCityInputTestId(defaultProps.testIdPrefix)
      )
    ).toBeVisible();

    const stateFormControl = screen.getByTestId(
      ADDRESS_FORM_TEST_IDS.getStateFormControlTestId(defaultProps.testIdPrefix)
    );

    expect(stateFormControl).toBeVisible();

    const stateSelector = within(stateFormControl).getByRole('button', {
      ...screen.getByTestId(
        ADDRESS_FORM_TEST_IDS.getStateTestId(defaultProps.testIdPrefix)
      ),
      expanded: false,
    });

    await user.click(stateSelector);

    STATES.forEach((state) => {
      expect(
        screen.getByTestId(
          ADDRESS_FORM_TEST_IDS.getAddressFormStateOptionTestId(
            defaultProps.testIdPrefix,
            state.abbreviation
          )
        )
      ).toBeVisible();
    });
  });
});

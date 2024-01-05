import { useForm } from 'react-hook-form';
import { render, screen, renderHook, within } from '../../../testUtils';
import { FormAutocomplete, FormAutocompleteProps } from './';

const mockTestId = 'form-autocomplete-test-id';

const mockOptionTestId = 'form-autocomplete-option-test-id';

const mockedName = 'test';
type MockFieldValues = { test: string };
type MockProps = FormAutocompleteProps<MockFieldValues, string>;

const mockOptions = ['test 1', 'test 2'];

const autocompleteProps: MockProps['autocompleteProps'] = {
  'data-testid': mockTestId,
  options: mockOptions,
  isOptionEqualToValue(option, value) {
    return option === value || value === '';
  },
  renderOption: (props, option) => (
    <li data-testid={`${mockOptionTestId}-${option}`} {...props}>
      {option}
    </li>
  ),
};

const setup = (props: Partial<MockProps> = {}) =>
  render(
    <FormAutocomplete
      name={mockedName}
      autocompleteProps={autocompleteProps}
      {...props}
    />
  );

describe('<FormSelect />', () => {
  it('should render correct', async () => {
    const { result } = renderHook(() =>
      useForm<MockFieldValues>({
        defaultValues: {
          test: '',
        },
      })
    );

    const { user } = setup({ control: result.current.control });

    const selectField = within(screen.getByTestId(mockTestId)).getByRole(
      'combobox'
    );

    expect(selectField).toBeVisible();

    await user.click(selectField);

    const options = await screen.findAllByTestId(new RegExp(mockOptionTestId));
    options.forEach((option) => {
      expect(option).toBeVisible();
    });

    const firstOption = options[0];

    await user.click(firstOption);

    const formTextFieldValues = result.current.getValues();

    const formTextFieldValue = formTextFieldValues[mockedName];

    const selectedOption = mockOptions[0];

    expect(formTextFieldValue).toBe(selectedOption);
  });
});

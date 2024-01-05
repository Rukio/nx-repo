import { useForm } from 'react-hook-form';
import { render, screen, renderHook } from '../../../testUtils';
import { FormDatePicker, FormDatePickerProps } from './';
import { LocalizationProvider } from '@*company-data-covered*/design-system';

const mockTestId = 'form-date-picker-test-id';

const mockedName = 'test';
type MockFieldValues = { test: string };

const textFieldProps = {
  inputProps: {
    'data-testid': mockTestId,
    placeholder: 'test placeholder',
  },
};

const setup = (
  props: Partial<FormDatePickerProps<MockFieldValues, string, string>> = {}
) =>
  render(
    <LocalizationProvider>
      <FormDatePicker
        name={mockedName}
        textFieldProps={textFieldProps}
        {...props}
      />
    </LocalizationProvider>
  );

describe('<FormDatePicker />', () => {
  it('should render correct', async () => {
    const { result } = renderHook(() =>
      useForm<MockFieldValues>({
        defaultValues: {
          test: '',
        },
      })
    );

    setup({ control: result.current.control });

    const formTextField = screen.getByTestId(mockTestId);

    expect(formTextField).toBeVisible();
    expect(formTextField).toHaveAttribute(
      'placeholder',
      textFieldProps.inputProps.placeholder
    );
  });

  it('should render update value', async () => {
    const { result } = renderHook(() =>
      useForm<MockFieldValues>({
        defaultValues: {
          test: '',
        },
      })
    );

    const { user } = setup({
      control: result.current.control,
      datePickerProps: {
        maxDate: new Date().toISOString(),
      },
    });
    const formTextField = screen.getByTestId(mockTestId);

    const mockedText = '01/01/2000';

    await user.clear(formTextField);

    await user.type(formTextField, mockedText);

    const formTextFieldValues = result.current.getValues();

    const formTextFieldValue = formTextFieldValues[mockedName];

    expect(formTextFieldValue).toStrictEqual(new Date(mockedText));
  });
});

import { useForm } from 'react-hook-form';
import { render, screen, renderHook } from '../../../testUtils';
import { FormTimePicker, FormTimePickerProps } from './';
import { LocalizationProvider } from '@*company-data-covered*/design-system';

const mockTestId = 'form-time-picker-test-id';

const mockedName = 'test';
type MockFieldValues = { test: string };

const textFieldProps = {
  inputProps: {
    'data-testid': mockTestId,
    placeholder: 'test placeholder',
  },
};

const setup = (
  props: Partial<FormTimePickerProps<MockFieldValues, string, string>> = {}
) =>
  render(
    <LocalizationProvider>
      <FormTimePicker
        name={mockedName}
        textFieldProps={textFieldProps}
        {...props}
      />
    </LocalizationProvider>
  );

describe('<FormTimePicker />', () => {
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
    });
    const formTextField = screen.getByTestId(mockTestId);

    const mockedText = '11:44';

    await user.clear(formTextField);

    await user.type(formTextField, mockedText);

    const formTextFieldValues = result.current.getValues();

    const formTextFieldValue = formTextFieldValues[mockedName];

    expect(formTextFieldValue).toStrictEqual(new Date(mockedText));
  });
});

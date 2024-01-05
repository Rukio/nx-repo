import { useForm } from 'react-hook-form';
import { render, screen, renderHook } from '../../../testUtils';
import { FormTextField, FormTextFieldProps } from './';

const mockTestId = 'form-text-field-test-id';

const mockedName = 'test';
type MockFieldValues = { test: string };

const textFieldProps = {
  inputProps: {
    'data-testid': mockTestId,
  },
  placeholder: 'test placeholder',
};

const setup = (props: Partial<FormTextFieldProps<MockFieldValues>> = {}) =>
  render(
    <FormTextField
      name={mockedName}
      textFieldProps={textFieldProps}
      {...props}
    />
  );

describe('<FormTextField />', () => {
  it('should render correct', async () => {
    const { result } = renderHook(() =>
      useForm<MockFieldValues>({
        defaultValues: {
          test: '',
        },
      })
    );

    const { user } = setup({ control: result.current.control });
    const formTextField = screen.getByTestId(mockTestId);

    expect(formTextField).toBeVisible();
    expect(formTextField).toHaveAttribute(
      'placeholder',
      textFieldProps.placeholder
    );

    const mockedText = 'test text';

    await user.type(formTextField, mockedText);

    const formTextFieldValues = result.current.getValues();

    const formTextFieldValue = formTextFieldValues[mockedName];

    expect(formTextFieldValue).toBe(mockedText);
  });
});

import { FieldValues, useForm } from 'react-hook-form';
import { render, screen, renderHook } from '../../../testUtils';
import { FormPatternFormat, FormPatternFormatProps } from './';

const mockTestId = 'form-pattern-format-test-id';

const mockedName = 'test';

const patternFormatProps = {
  inputProps: {
    'data-testid': mockTestId,
  },
  placeholder: 'test placeholder',
  format: '###-###-####',
};

const setup = (props: Partial<FormPatternFormatProps<FieldValues>> = {}) =>
  render(
    <FormPatternFormat
      name={mockedName}
      patternFormatProps={patternFormatProps}
      {...props}
    />
  );

describe('<FormPatternFormat />', () => {
  it('should render correct', async () => {
    const { result } = renderHook(() => useForm());

    const { user } = setup({ control: result.current.control });
    const formTextField = screen.getByTestId(mockTestId);

    expect(formTextField).toBeVisible();
    expect(formTextField).toHaveAttribute(
      'placeholder',
      patternFormatProps.placeholder
    );

    const mockedText = '8009001081';

    await user.type(formTextField, mockedText);

    const formTextFieldValues = result.current.getValues();

    const formTextFieldValue = formTextFieldValues[mockedName];

    expect(formTextFieldValue).toBe('800-900-1081');
  });
});

import { FieldValues, useForm } from 'react-hook-form';
import { render, screen, renderHook } from '../../../testUtils';
import { FormLabelControl, FormLabelControlProps } from '.';
import { Checkbox } from '@*company-data-covered*/design-system';

const mockTestId = 'form-text-field-test-id';

const mockedName = 'testCheckBox';

const formControlLabelRadioProps = {
  'data-testid': mockTestId,
  label: 'test',
  control: <Checkbox />,
};

const setup = (props: Partial<FormLabelControlProps<FieldValues>> = {}) =>
  render(
    <FormLabelControl
      name={mockedName}
      formControlLabelProps={formControlLabelRadioProps}
      {...props}
    />
  );

describe('<FormLabelControl />', () => {
  it('should render correct', async () => {
    const { result } = renderHook(() => useForm());

    const { user } = setup({ control: result.current.control });
    const formLabelControl = screen.getByTestId(mockTestId);

    expect(formLabelControl).toBeVisible();
    expect(formLabelControl).toHaveTextContent(
      formControlLabelRadioProps.label
    );

    const formLabelControlInitValues = result.current.getValues();
    const formLabelControlInitValue = formLabelControlInitValues[mockedName];
    expect(formLabelControlInitValue).toBe(undefined);

    await user.click(formLabelControl);

    const formLabelControlValues = result.current.getValues();
    const formLabelControlValue = formLabelControlValues[mockedName];
    expect(formLabelControlValue).toBe(true);
  });
});

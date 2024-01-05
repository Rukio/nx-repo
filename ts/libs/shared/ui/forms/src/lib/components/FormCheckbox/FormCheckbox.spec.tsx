import { useForm } from 'react-hook-form';
import {
  render,
  screen,
  renderHook,
  waitFor,
  within,
} from '../../../testUtils';
import { FormCheckbox, FormCheckboxProps } from './FormCheckbox';

const mockFormControlLabelTestId = 'form-form-control-label-test-id';

const mockCheckboxTestId = 'form-checkbox-test-id';

const mockedName = 'test';
type MockFieldValues = { test: boolean };
type MockProps = FormCheckboxProps<MockFieldValues>;

const formControlLabelProps: MockProps['formControlLabelProps'] & {
  label: string;
} = {
  'data-testid': mockFormControlLabelTestId,
  label: 'test',
};

const checkboxProps: MockProps['checkboxProps'] = {
  'data-testid': mockCheckboxTestId,
};

const setup = (props: Partial<MockProps> = {}) =>
  render(
    <FormCheckbox
      name={mockedName}
      formControlLabelProps={formControlLabelProps}
      checkboxProps={checkboxProps}
      {...props}
    />
  );

describe('<FormCheckbox />', () => {
  it('should render correct', async () => {
    const { result } = renderHook(() =>
      useForm<MockFieldValues>({
        defaultValues: {
          test: false,
        },
      })
    );

    const { user } = setup({ control: result.current.control });

    const formControlLabel = screen.getByTestId(mockFormControlLabelTestId);

    expect(formControlLabel).toBeVisible();

    expect(formControlLabel).toHaveTextContent(formControlLabelProps.label);

    const formCheckbox = within(
      screen.getByTestId(mockCheckboxTestId)
    ).getByRole('checkbox');
    expect(formCheckbox).not.toBeChecked();

    await user.click(formControlLabel);

    await waitFor(() => {
      expect(formCheckbox).toBeChecked();
    });
  });
});

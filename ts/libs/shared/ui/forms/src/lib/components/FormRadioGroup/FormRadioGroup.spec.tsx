import { useForm } from 'react-hook-form';
import { render, screen, renderHook } from '../../../testUtils';
import { FormRadioGroup, FormRadioGroupProps } from '.';

const mockedName = 'test';
type MockFieldValues = { test: string };
const mockedRadioOptions = [
  {
    value: 'Option 1',
    'data-testid': 'option-1',
    label: 'option 1',
  },
  {
    value: 'Option 2',
    'data-testid': 'option-2',
    label: 'option 2',
  },
];

const setup = (props: Partial<FormRadioGroupProps<MockFieldValues>> = {}) =>
  render(
    <FormRadioGroup
      name={mockedName}
      radioOptions={mockedRadioOptions}
      {...props}
    />
  );

describe('<FormRadioGroup />', () => {
  it('should render correct', async () => {
    const { result } = renderHook(() =>
      useForm<MockFieldValues>({
        defaultValues: {
          test: '',
        },
      })
    );

    const { user } = setup({ control: result.current.control });

    const formRadioGroupOptionOne = screen.getByTestId(
      mockedRadioOptions[0]['data-testid']
    );
    expect(formRadioGroupOptionOne).toBeVisible();
    expect(formRadioGroupOptionOne).toHaveTextContent(
      mockedRadioOptions[0].label
    );

    await user.click(formRadioGroupOptionOne);

    const formRadioGroupValues = result.current.getValues();
    const formRadioGroupValue = formRadioGroupValues[mockedName];
    expect(formRadioGroupValue).toBe(mockedRadioOptions[0].value);
  });
});

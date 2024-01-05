import { FieldValues, useForm } from 'react-hook-form';
import { render, screen, renderHook } from '../../../testUtils';
import { FormToggleButtonGroup, FormToggleButtonGroupProps } from '.';

const mockedName = 'testToggleButton';
const toggleButtonsDataTestId = 'testToggleButtonTestId';
const mockedToggleButtons = [
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

const setup = (props: Partial<FormToggleButtonGroupProps<FieldValues>> = {}) =>
  render(
    <FormToggleButtonGroup
      name={mockedName}
      toggleButtonsProps={{ 'data-testid': toggleButtonsDataTestId }}
      toggleButtons={mockedToggleButtons}
      {...props}
    />
  );

describe('<FormToggleButtonGroup />', () => {
  it('should render correct', async () => {
    const { result } = renderHook(() => useForm());

    const { user } = setup({ control: result.current.control });

    const formToggleButtonGroupOne = screen.getByTestId(
      mockedToggleButtons[0]['data-testid']
    );
    expect(formToggleButtonGroupOne).toBeVisible();
    expect(formToggleButtonGroupOne).toHaveTextContent(
      mockedToggleButtons[0].value
    );

    const formToggleButtonGroupTwo = screen.getByTestId(
      mockedToggleButtons[1]['data-testid']
    );
    expect(formToggleButtonGroupTwo).toBeVisible();
    expect(formToggleButtonGroupTwo).toHaveTextContent(
      mockedToggleButtons[1].value
    );

    await user.click(formToggleButtonGroupOne);

    const formToggleButtonGroupValues = result.current.getValues();
    const formToggleButtonGroupValue = formToggleButtonGroupValues[mockedName];
    expect(formToggleButtonGroupValue).toBe(mockedToggleButtons[0].value);
  });
});

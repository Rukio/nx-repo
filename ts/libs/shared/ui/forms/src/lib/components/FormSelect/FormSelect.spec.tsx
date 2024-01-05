import { useForm } from 'react-hook-form';
import { MenuItem } from '@*company-data-covered*/design-system';
import { render, screen, renderHook } from '../../../testUtils';
import { FormSelect, FormSelectProps } from './';

const mockTestId = 'form-date-picker-test-id';

const mockedFirstOptionTestId = 'test-option-1';

const mockedSecondOptionTestId = 'test-option-2';

const mockedName = 'test';
type MockFieldValues = { test: string };

const selectProps = {
  'data-testid': mockTestId,
};

const mockOptions = [
  {
    label: 'test 1',
    value: 'test 1',
    dataTestId: mockedFirstOptionTestId,
  },
  {
    label: 'test 2',
    value: 'test 2',
    dataTestId: mockedSecondOptionTestId,
  },
];

const setup = (props: Partial<FormSelectProps<MockFieldValues>> = {}) =>
  render(
    <FormSelect name={mockedName} selectProps={selectProps} {...props}>
      {mockOptions.map((option) => (
        <MenuItem
          data-testid={option.dataTestId}
          key={option.value}
          value={option.value}
        >
          {option.label}
        </MenuItem>
      ))}
    </FormSelect>
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

    const selectField = screen.getByRole('button', {
      ...screen.getByTestId(mockTestId),
      expanded: false,
    });

    expect(selectField).toBeVisible();

    await user.click(selectField);

    const firstOption = screen.getByTestId(mockedFirstOptionTestId);

    await user.click(firstOption);

    const formTextFieldValues = result.current.getValues();

    const formTextFieldValue = formTextFieldValues[mockedName];

    const selectedOption = mockOptions.find(
      (option) => option.dataTestId === mockedFirstOptionTestId
    );

    expect(formTextFieldValue).toBe(selectedOption?.value);
  });
});

import { FieldValues, useForm } from 'react-hook-form';
import { render, screen, renderHook } from '../../../testUtils';
import { FormSelect, FormSelectProps } from '../../components/FormSelect';
import { getFormSelectMenuItems, FORM_SELECT_MENU_ITEM_TEST_IDS } from '.';
import { FormMenuItem } from '../../types';

const mockFormSelectTestId = 'form-select-test-id';
const mockFormSelectMenuItemTestId = 'form-select-menu-item-id';

const mockedName = 'test';

const selectProps = {
  'data-testid': mockFormSelectTestId,
};

const mockMenuItems: FormMenuItem[] = [
  {
    label: 'test 1',
    value: 'test 1',
  },
  {
    label: 'test 2',
    value: 'test 2',
  },
];

const setup = (props: Partial<FormSelectProps<FieldValues>> = {}) =>
  render(
    <FormSelect name={mockedName} selectProps={selectProps} {...props}>
      {getFormSelectMenuItems(mockMenuItems, mockFormSelectMenuItemTestId)}
    </FormSelect>
  );

describe('getFormSelectMenuItems', () => {
  it('should render correct', async () => {
    const { result } = renderHook(() => useForm());

    const { user } = setup({ control: result.current.control });

    const selectField = screen.getByRole('button', {
      ...screen.getByTestId(mockFormSelectTestId),
      expanded: false,
    });

    expect(selectField).toBeVisible();

    await user.click(selectField);

    const selectedItem = mockMenuItems[0];

    const firstItem = await screen.findByTestId(
      FORM_SELECT_MENU_ITEM_TEST_IDS.getFormSelectMenuItem(
        mockFormSelectMenuItemTestId,
        selectedItem.value
      )
    );

    await user.click(firstItem);

    const formTextFieldValues = result.current.getValues();

    const formTextFieldValue = formTextFieldValues[mockedName];

    expect(formTextFieldValue).toBe(selectedItem.value);
  });
});

import { render, screen, userEvent, waitFor } from '../../../../../test-utils';
import { NOTE_TEST_IDS } from '../../testIds';
import EditSection, { EditSectionProps } from './EditSection';

const mockDefaultProps: EditSectionProps = {
  text: 'Note text',
  onCancel: jest.fn(),
  onSave: jest.fn(),
};

const setup = (props?: Partial<EditSectionProps>) => ({
  ...render(<EditSection {...mockDefaultProps} {...props} />),
  user: userEvent.setup(),
});

describe('EditSection', () => {
  test('should call onCancel on "Cancel" button click', async () => {
    const { user } = setup();

    const editInput = screen.getByTestId(NOTE_TEST_IDS.EDIT_INPUT);
    expect(editInput).toBeVisible();
    expect(editInput).toHaveValue(mockDefaultProps.text);

    const editCancelButton = screen.getByTestId(
      NOTE_TEST_IDS.EDIT_CANCEL_BUTTON
    );
    expect(editCancelButton).toBeVisible();
    expect(editCancelButton).toBeEnabled();

    await user.click(editCancelButton);

    await waitFor(() => {
      expect(mockDefaultProps.onCancel).toBeCalled();
    });
  });

  test('should call onSave on "Save changes" button click and text is not same with inital', async () => {
    const { user } = setup();

    const editInput = screen.getByTestId(NOTE_TEST_IDS.EDIT_INPUT);
    expect(editInput).toBeVisible();
    expect(editInput).toHaveValue(mockDefaultProps.text);

    const editSaveChangesButton = screen.getByTestId(
      NOTE_TEST_IDS.EDIT_SAVE_CHANGES_BUTTON
    );
    expect(editSaveChangesButton).toBeVisible();
    expect(editSaveChangesButton).toBeDisabled();

    const newText = 'New text';

    await user.clear(editInput);

    expect(editSaveChangesButton).toBeDisabled();

    await user.type(editInput, newText);

    await waitFor(() => {
      expect(editSaveChangesButton).toBeEnabled();
    });

    expect(editInput).toHaveValue(newText);

    await user.click(editSaveChangesButton);

    await waitFor(() => {
      expect(mockDefaultProps.onSave).toBeCalledWith(newText);
    });
  });
});

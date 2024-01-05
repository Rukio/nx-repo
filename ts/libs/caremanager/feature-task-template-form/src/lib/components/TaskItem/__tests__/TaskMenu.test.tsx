import { screen } from '@testing-library/react';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import TaskMenu from '../TaskMenu';

const setEditMode = vi.fn();
const deleteTask = vi.fn();

const setup = () => {
  renderWithClient(
    <TaskMenu
      episodeId="1"
      id="1"
      onEditModeChange={setEditMode}
      onDelete={deleteTask}
    />
  );
};

describe('TaskMenu', () => {
  it('should open menu', async () => {
    setup();
    const menuButton = screen.getByTestId('task-menu-button');
    menuButton.click();
    const taskMenu = await screen.findByTestId('task-menu');
    expect(taskMenu).toBeInTheDocument();
  });

  it('should trigger edit mode', async () => {
    setup();
    const menuButton = screen.getByTestId('task-menu-button');
    menuButton.click();
    const edit = await screen.findByText('Edit');
    expect(edit).toBeInTheDocument();
    edit.click();
    expect(setEditMode).toHaveBeenCalled();
  });

  it('should trigger delete', async () => {
    setup();
    const menuButton = screen.getByTestId('task-menu-button');
    menuButton.click();
    const deleteItem = await screen.findByText('Delete');
    expect(deleteItem).toBeInTheDocument();
    deleteItem.click();
    expect(deleteTask).toHaveBeenCalled();
  });
});

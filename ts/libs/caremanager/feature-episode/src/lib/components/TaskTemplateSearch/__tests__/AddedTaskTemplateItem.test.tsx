import { screen } from '@testing-library/react';

import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import AddedTaskTemplateItem from '../AddedTaskTemplateItem';

const handleRemove = vi.fn();

const listItem = {
  id: '1',
  serviceLine: {
    id: '0',
    name: 'Advance Care',
    shortName: 'AC',
  },
  serviceLineId: '0',
  name: 'My Template',
  summary: 'Something',
  tasksCount: '5',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  updatedByUserId: '1',
};

const setup = (remove: boolean) => {
  renderWithClient(
    <AddedTaskTemplateItem
      listItem={listItem}
      handleRemove={remove ? handleRemove : undefined}
    />
  );
};

describe('Item in added task template list.', () => {
  it('displays name and service line.', () => {
    setup(false);
    expect(
      screen.getByTestId('add-task-template-menu-item-1')
    ).toHaveTextContent('Advance Care - My Template');
  });

  it('displays prev added message..', () => {
    setup(false);
    expect(
      screen.getByTestId('add-task-template-prev-added-1')
    ).toHaveTextContent('Previously Added');
  });

  it('displays Remove button.', () => {
    setup(true);
    expect(
      screen.getByTestId('add-task-template-remove-item-1')
    ).toBeInTheDocument();
  });
});

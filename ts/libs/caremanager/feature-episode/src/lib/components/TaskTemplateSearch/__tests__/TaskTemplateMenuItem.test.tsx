import { screen, waitFor } from '@testing-library/react';
import { Formik } from 'formik';

import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import TaskTemplateMenuItem from '../TaskTemplateMenuItem';

const setTemplateList = vi.fn();

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
  createdAt: new Date().toString(),
  updatedAt: new Date().toString(),
  updatedByUserId: '1',
};
const props = {
  templateItem: listItem,
  handleClose: vi.fn(),
  setTemplateList,
};
const setup = ({ templateIds }: { templateIds: string[] }) => {
  const initialValues = {
    applyTemplateIds: templateIds,
  };
  renderWithClient(
    <Formik initialValues={initialValues} onSubmit={() => undefined}>
      <TaskTemplateMenuItem {...props} />
    </Formik>
  );
};

describe('Item in task template search menu', () => {
  it('displays name and serviceline', () => {
    setup({ templateIds: [] });
    expect(
      screen.getByTestId('task-template-menu-list-item-1')
    ).toHaveTextContent('Advance Care - My Template');
  });

  it('displays Add button if non-added id', () => {
    setup({ templateIds: ['0'] });
    expect(
      screen.getByTestId('add-task-template-button-1')
    ).toBeInTheDocument();
  });

  it('uses setTemplateList list on click', async () => {
    setup({ templateIds: ['0'] });
    const addButton = screen.getByTestId('add-task-template-button-1');
    addButton.click();
    await waitFor(() => {
      expect(setTemplateList).toHaveBeenCalled();
    });
  });

  it('displays "Added"', () => {
    setup({ templateIds: ['1'] });
    expect(screen.getByTestId('added-task-template-text-1')).toHaveTextContent(
      'Added'
    );
  });
});

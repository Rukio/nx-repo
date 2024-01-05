import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Formik } from 'formik';

import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { TaskTemplateSearch } from '../TaskTemplateSearch';

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
}));

const episodeTaskTemplates = [
  {
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
  },
];

const initialValues = {
  applyTemplateIds: [],
};
const setup = () => {
  renderWithClient(
    <Formik initialValues={initialValues} onSubmit={() => undefined}>
      <TaskTemplateSearch episodeTemplates={episodeTaskTemplates} />
    </Formik>
  );
};

describe('Item in task template search menu', () => {
  beforeEach(() => {
    setup();
    const clickInput = screen.getByTestId('task-template-search-click-input');
    clickInput.click();
  });

  it('opens popover menu', async () => {
    await waitFor(() => {
      expect(
        screen.getByTestId('search-template-menu-popover')
      ).toBeInTheDocument();
    });
  });

  it('displays found template', async () => {
    const searchInput = screen.getByTestId('task-template-search-dom-input');
    fireEvent.change(searchInput, {
      target: { value: 'Postpartum Advanced Care' }, // from mock server
    });
    await waitFor(() => {
      expect(
        screen.getByTestId('task-template-menu-list-item-3')
      ).toBeInTheDocument();
    });
  });

  it('displays message when nothing found', async () => {
    const searchInput = screen.getByTestId('task-template-search-dom-input');
    fireEvent.change(searchInput, {
      target: { value: 'xxx' },
    });
    await waitFor(() => {
      expect(
        screen.getByTestId('task-template-query-not-found')
      ).toBeInTheDocument();
    });
  });
});

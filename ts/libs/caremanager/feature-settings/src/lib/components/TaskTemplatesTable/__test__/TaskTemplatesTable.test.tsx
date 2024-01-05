import { screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import TaskTemplatesTable from '../TaskTemplatesTable';

const TOTAL_COUNT = 31415926;
const PAGE_SIZE = 15;
const PAGE = 432;
const TOTAL_PAGES = Math.ceil(TOTAL_COUNT / PAGE_SIZE);
const setPageMockFn = vi.fn();
const setPageSizeMockFn = vi.fn();

type SetupParams = {
  isLoading?: boolean;
  emptyTable?: boolean;
};

const setup = ({ isLoading = false, emptyTable = false }: SetupParams) => {
  const templates = [
    {
      id: '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: 'Advanced Care Tasks - Special Cases',
      summary:
        'Lorem ipsum ex magna commodo exercitation ut commodo officia tempor veniam.',
      tasksCount: '7',
      serviceLine: {
        id: '1',
        name: 'Advanced Care',
        shortName: 'AdC',
      },
      serviceLineId: '1',
      carePhase: {
        id: '2',
        name: 'High Acuity',
        phaseType: 'active',
      },
      updatedByUserId: '441',
    },
  ];

  const { container } = renderWithClient(
    <Router>
      <TaskTemplatesTable
        isLoading={isLoading}
        order="asc"
        orderBy="name"
        templates={emptyTable ? [] : templates}
        setPage={setPageMockFn}
        setPageSize={setPageSizeMockFn}
        page={PAGE.toString()}
        pageSize={PAGE_SIZE.toString()}
        totalCount={TOTAL_COUNT.toString()}
        totalPages={TOTAL_PAGES.toString()}
        onSortChange={vi.fn()}
      />
    </Router>
  );

  return { container };
};

describe('Task Templates Table tests', () => {
  it('Renders Task Templates Table', async () => {
    setup({});
    expect(
      await screen.findByTestId('task-templates-table')
    ).toBeInTheDocument();
  });

  it('Click Task Templates Table row more button', async () => {
    setup({});
    (await screen.findByTestId('task-template-more-button-1')).click();
    expect(
      await screen.findByTestId('task-templates-menu')
    ).toBeInTheDocument();

    (await screen.findByText('Delete')).click();
    expect(
      await screen.findByTestId('delete-task-template-modal')
    ).toBeInTheDocument();
    screen.getByTestId('delete-template-button').click();
  });

  it('should render table correctly with header, body, and pagination', () => {
    setup({});
    expect(screen.getByTestId('task-templates-table')).toBeInTheDocument();
    expect(screen.getByTestId('sortable-table-header')).toBeInTheDocument();
    expect(screen.getByTestId('table-body')).toBeInTheDocument();
    expect(screen.getByTestId('table-pagination')).toBeInTheDocument();
  });

  it('Renders total count', async () => {
    setup({});
    expect(
      await screen.findByText(
        `${(PAGE - 1) * PAGE_SIZE + 1}-${PAGE * PAGE_SIZE} of ${TOTAL_COUNT}`
      )
    ).toBeInTheDocument();
  });

  it('Clicks on next page', () => {
    setup({});
    screen.getByLabelText('Go to next page').click();
    expect(setPageMockFn.mock.calls.length).toBe(1);
  });

  it('should show loading state', async () => {
    setup({ isLoading: true });
    expect(
      await screen.findByTestId('loading-task-templates-list')
    ).toBeInTheDocument();
  });

  it('should show empty table state', async () => {
    setup({ emptyTable: true });
    expect(
      await screen.findByTestId('no-templates-container')
    ).toBeInTheDocument();
  });
});

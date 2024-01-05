import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { fireEvent, screen } from '@testing-library/react';
import { ReviewQueueColumn } from '../ReviewQueueColumn';

const requestedStatus = {
  id: '1',
  name: 'Requested',
  slug: 'requested',
  isActive: true,
};

const openSidebarFn = vi.fn();
vi.mock('../SidebarContext', () => ({
  useSidebarContext: () => ({
    openSidebar: openSidebarFn,
  }),
}));

const setup = () =>
  renderWithClient(<ReviewQueueColumn status={requestedStatus} />);

describe('ReviewQueueColumn', () => {
  afterEach(() => vi.resetAllMocks());

  it('should render the title and matching cards', async () => {
    setup();
    expect(await screen.findByText('Requested')).toBeInTheDocument();
    expect(
      await screen.findByTestId('service-request-card-1')
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId('service-request-card-5')
    ).toBeInTheDocument();
  });

  it('should call the side panel open callback on click', async () => {
    setup();
    const card = await screen.findByTestId('selectable-service-request-card-1');
    fireEvent.click(card);
    expect(openSidebarFn).toBeCalledWith('1');
  });
});

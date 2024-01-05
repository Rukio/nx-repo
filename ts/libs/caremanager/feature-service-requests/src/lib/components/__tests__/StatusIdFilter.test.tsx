import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { StatusIdFilter } from '../StatusIdFilter';
import { fireEvent, screen } from '@testing-library/react';

const setStatusId = vi.fn();

const setup = (statusId = '1') =>
  renderWithClient(
    <StatusIdFilter statusId={statusId} setStatusId={setStatusId} />
  );

describe('StatusIdFilter', () => {
  afterEach(() => vi.resetAllMocks());

  it('should display the current status', async () => {
    setup('1');

    expect(
      await screen.findByTestId('service-request-status-filter')
    ).toHaveTextContent('Requested');
  });

  it('should set a different status', async () => {
    setup();

    fireEvent.click(await screen.findByTestId('service-request-status-filter'));
    fireEvent.click(
      await screen.findByTestId('service-request-status-filter-2')
    );

    expect(setStatusId).toHaveBeenCalledWith('2');
  });
});

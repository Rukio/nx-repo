import { fireEvent, render, screen } from '@testing-library/react';
import { FiltersProvider, useFiltersContext } from '../FiltersContext';
import { MemoryRouter } from 'react-router-dom';

const TestComponent = () => {
  const {
    marketIds,
    searchTerm,
    statusId,
    setMarketIds,
    setSearchTerm,
    setStatusId,
  } = useFiltersContext();

  return (
    <>
      <p data-testid="search-term">{searchTerm}</p>
      <p data-testid="market-ids">{marketIds.join(',')}</p>
      <p data-testid="status-id">{statusId}</p>
      <button
        data-testid="set-search-term-button"
        onClick={() => setSearchTerm('pacman')}
      ></button>
      <button
        data-testid="set-market-ids-button"
        onClick={() => setMarketIds(['131', '191'])}
      ></button>
      <button
        data-testid="set-status-id-button"
        onClick={() => setStatusId('3')}
      ></button>
    </>
  );
};

const setup = (path?: string) =>
  render(
    <MemoryRouter initialEntries={[path || '']}>
      <FiltersProvider>
        <TestComponent />
      </FiltersProvider>
    </MemoryRouter>
  );

describe('FiltersContext', () => {
  it('should parse data from the URL', () => {
    setup('?searchTerm=tom&marketIds=3&marketIds=5');
    expect(screen.getByTestId('search-term').textContent).toBe('tom');
    expect(screen.getByTestId('market-ids').textContent).toBe('3,5');
  });

  it('should set the search term', () => {
    setup();
    fireEvent.click(screen.getByTestId('set-search-term-button'));
    expect(screen.getByTestId('search-term').textContent).toBe('pacman');
  });

  it('should set market ids', () => {
    setup();
    fireEvent.click(screen.getByTestId('set-market-ids-button'));
    expect(screen.getByTestId('market-ids').textContent).toBe('131,191');
  });

  it('should set status id', () => {
    setup();
    fireEvent.click(screen.getByTestId('set-status-id-button'));
    expect(screen.getByTestId('status-id').textContent).toBe('3');
  });
});

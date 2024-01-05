import { fireEvent, screen, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { EpisodeListPage } from '../Episodes';

const setup = () => {
  renderWithClient(
    <Router>
      <EpisodeListPage />
    </Router>
  );
};

describe('/', () => {
  it('renders page', () => {
    setup();

    expect(screen.getByTestId('episodes-section-header')).toBeInTheDocument();

    expect(screen.getByTestId('episode-table')).toBeInTheDocument();
  });

  it('there is a different view for when there are no episodes', async () => {
    setup();

    const dataTestId = `patient-details-cell-${JSONMocks.episodesPage1.episodes[0].id}`;
    const firstName = JSONMocks.episodesPage1.episodes[0].patient.first_name;

    await waitFor(() =>
      expect(screen.getByTestId(dataTestId).textContent).toMatch(firstName)
    );
    expect(screen.queryByTestId('no-episodes')).not.toBeInTheDocument();
    const searchBar = screen.getByTestId('search-input');
    // this returns [] as the result of the query
    fireEvent.change(searchBar, { target: { value: 'none' } });

    // Need to wait for debounce
    await waitFor(
      () => {
        expect(screen.getByTestId('no-episodes')).toBeInTheDocument();
      },
      { timeout: 4000 }
    );
  }, 10000);
});

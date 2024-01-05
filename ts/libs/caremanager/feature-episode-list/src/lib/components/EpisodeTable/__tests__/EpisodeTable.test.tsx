import { screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ROWS_PER_PAGE_OPTIONS } from '@*company-data-covered*/caremanager/utils';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import {
  Episode,
  GetEpisodesResponseFromJSON,
} from '@*company-data-covered*/caremanager/data-access-types';
import EpisodeTable from '../EpisodeTable';

const episodeId = JSONMocks.episodesPage1.episodes[0].id;

type SetupParams = {
  episodes?: Episode[];
  isLoading?: boolean;
  rowsPerPage?: number;
};

const setup = ({ episodes, isLoading = false, rowsPerPage }: SetupParams) => {
  const results = GetEpisodesResponseFromJSON(JSONMocks.episodesPage1);
  renderWithClient(
    <BrowserRouter>
      <EpisodeTable
        isLoading={isLoading}
        isError={false}
        episodes={episodes || results.episodes}
        page={Number(results.meta?.currentPage)}
        totalPages={Number(results.meta?.totalPages)}
        totalResults={Number(results.meta?.totalResults)}
        rowsPerPage={rowsPerPage || ROWS_PER_PAGE_OPTIONS[0]}
        setRowsPerPage={vi.fn()}
        setPage={vi.fn()}
      />
    </BrowserRouter>
  );
};

describe('episodes table', () => {
  it('renders all subcomponent cells', () => {
    setup({});
    expect(
      screen.getByTestId(`patient-details-cell-${episodeId}`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`episode-details-cell-${episodeId}`)
    ).toBeInTheDocument();
    expect(screen.getByTestId(`summary-cell-${episodeId}`)).toBeInTheDocument();
    expect(screen.getByTestId(`note-cell-${episodeId}`)).toBeInTheDocument();
    expect(screen.getByTestId(`task-cell-${episodeId}`)).toBeInTheDocument();
  });

  it('renders all rows', async () => {
    setup({ isLoading: false });
    expect(await screen.findAllByTestId('episode-row')).toHaveLength(5);
  });

  it('empty list renders empty table component', () => {
    setup({ isLoading: false, episodes: [], rowsPerPage: 5 });
    expect(screen.getByTestId('no-episodes')).toBeInTheDocument();
  });

  it('loading list renders skeleton component', async () => {
    setup({ isLoading: true, rowsPerPage: 5 });
    expect(
      await screen.findAllByTestId('episodes-table-skeleton')
    ).toHaveLength(5);
  });
});

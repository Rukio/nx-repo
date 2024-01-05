import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { EpisodePage } from '../EpisodePage';

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<Record<string, unknown>>();

  return {
    ...mod,
    useParams: () => ({ id: 1 }),
  };
});

const setup = () => {
  renderWithClient(
    <MemoryRouter initialEntries={['/episodes/1/overview']}>
      <EpisodePage />
    </MemoryRouter>
  );
};

describe('/episode/1', () => {
  beforeEach(() => {
    setup();
  });

  it('Renders Episode Skeleton', () => {
    expect(screen.getByTestId('episodeSkeleton')).toBeInTheDocument();
  });

  it('Renders Episode Page', async () => {
    const patientName = `${JSONMocks.episode.episode.patient.first_name} ${JSONMocks.episode.episode.patient.last_name}`;
    expect(await screen.findByText(patientName)).toBeInTheDocument();
  });
});

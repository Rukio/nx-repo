import {
  fireEvent,
  screen,
  waitForElementToBeRemoved,
  within,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import {
  Episode,
  EpisodeFromJSON,
  Patient,
  PatientFromJSON,
  Visit,
  VisitFromJSON,
} from '@*company-data-covered*/caremanager/data-access-types';
import { Header, testIds } from '../components/Header';
import { VisitPage } from '../Visit';

const setup = (path: string) => {
  renderWithClient(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/episodes/:episodeId/visits/:visitId"
          element={<VisitPage />}
        />
      </Routes>
    </MemoryRouter>
  );
};

const setupHeader = (
  episode: Episode,
  visit: Visit,
  patient: Patient,
  isCall?: boolean
) => {
  renderWithClient(
    <MemoryRouter>
      <Header
        episode={episode}
        visit={visit}
        patient={patient}
        isCall={isCall}
      />
    </MemoryRouter>
  );
};

describe('Visit Header', () => {
  const episode = EpisodeFromJSON(JSONMocks.episode.episode);
  const visit = VisitFromJSON(JSONMocks.visit);
  const patient = PatientFromJSON(JSONMocks.createdPatient);

  it('should render service line if it is not a call visit', async () => {
    setupHeader(episode, visit, patient);
    expect(await screen.findByText('Service line')).toBeInTheDocument();
  });

  it('should not render service line if is call visit', () => {
    setupHeader(episode, visit, patient, true);
    expect(screen.queryByText('Service line')).not.toBeInTheDocument();
  });
});

describe('Visit', () => {
  it('renders visit header with data', async () => {
    setup('/episodes/545/visits/1');

    const header = await screen.findByTestId(testIds.VISIT_DETAILS_HEADER);

    expect(
      await within(header).findByText('Maria Martinez')
    ).toBeInTheDocument();
    expect(await within(header).findByText('Visit ID 221')).toBeInTheDocument();
    expect(await within(header).findByText('LOS')).toBeInTheDocument();
    expect(await within(header).findByText('16d')).toBeInTheDocument();
    expect(await within(header).findByText('Payer')).toBeInTheDocument();
    expect(await within(header).findByText('GNP')).toBeInTheDocument();
    expect(await within(header).findByText('Service line')).toBeInTheDocument();
    expect(
      await within(header).findByText('Advanced Care')
    ).toBeInTheDocument();
    expect(await within(header).findByText('Care phase')).toBeInTheDocument();
    expect(await within(header).findByText('High Acuity')).toBeInTheDocument();
    expect(await within(header).findByText('Visit type')).toBeInTheDocument();
    expect(
      await within(header).findByText('Bridge Care Plus')
    ).toBeInTheDocument();
  });

  it('renders page not found when the episode id from the path does not match the one from the visit', async () => {
    setup('/episodes/123/visits/1');

    expect(await screen.findByText('Page not found')).toBeInTheDocument();
  });

  it('shows/hides edit visit modal on header button click', async () => {
    setup('/episodes/545/visits/1');

    const headerButton = await screen.findByTestId(
      testIds.VISIT_DETAILS_HEADER_BUTTON
    );
    fireEvent.click(headerButton);

    const visitDetailsModal = await screen.findByText('Visit Details');
    expect(visitDetailsModal).toBeInTheDocument();

    const cancelButton = await screen.findByText('Cancel');
    fireEvent.click(cancelButton);

    await waitForElementToBeRemoved(visitDetailsModal);
  });
});

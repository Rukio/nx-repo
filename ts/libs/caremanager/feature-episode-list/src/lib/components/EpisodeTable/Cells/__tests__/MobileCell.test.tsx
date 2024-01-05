import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { EpisodeFromJSON } from '@*company-data-covered*/caremanager/data-access-types';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import MobileCell from '../MobileCell';

const tenYearsAgo = new Date(Date.now() - 10 * 365.5 * 86400000);
const yesterday = new Date(Date.now() - 86400000);

const patient = {
  id: '0',
  firstName: 'Joan',
  middleName: 'of',
  lastName: 'Arc',
  dateOfBirth: tenYearsAgo.toString(),
  sex: 'female',
};

const setup = () => {
  const episode = EpisodeFromJSON(JSONMocks.episode.episode);
  episode.patient = patient;
  episode.admittedAt = yesterday.toISOString();
  episode.dischargedAt = undefined;

  const serviceLine = {
    id: '1',
    name: 'Advanced Care',
    shortName: 'AC',
  };

  renderWithClient(
    <MemoryRouter>
      <MobileCell episode={episode} serviceLine={serviceLine} />
    </MemoryRouter>
  );
};

describe('MobileCell', () => {
  it('should display name, age, sex, service line, care phase and length of stay', () => {
    setup();
    expect(screen.getByText('Joan of Arc')).toBeInTheDocument();
    expect(screen.getByText('10yo F')).toBeInTheDocument();
    expect(
      screen.getByText('Advanced Care, High Acuity, LOS 1d')
    ).toBeInTheDocument();
  });
});

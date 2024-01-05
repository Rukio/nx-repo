import { screen } from '@testing-library/react';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { EpisodeFromJSON } from '@*company-data-covered*/caremanager/data-access-types';
import DetailsCell from '../DetailsCell';

const setup = (carePhase = 'Pending') => {
  const yesterday = new Date(Date.now() - 86400000);
  const episode = EpisodeFromJSON(JSONMocks.episode.episode);
  episode.carePhase = {
    id: episode.carePhase?.id || '1',
    phaseType: episode.carePhase?.phaseType || '',
    name: carePhase,
  };
  episode.admittedAt = yesterday.toISOString();
  episode.dischargedAt = undefined;

  renderWithClient(<DetailsCell containerStyles={{}} episode={episode} />);
};

describe('episodes details cell', () => {
  it('pending status dot color', () => {
    setup('Pending');
    const statusDot = screen.getByTestId('status-dot-1');
    expect(statusDot).toHaveStyle('background-color: rgb(25, 118, 210)');
  });

  it('high acuity dot color', () => {
    setup('High Acuity');
    const statusDot = screen.getByTestId('status-dot-1');
    expect(statusDot).toHaveStyle('background-color: rgb(211, 47, 47)');
  });

  it('transition dot color', () => {
    setup('Transition - High');
    const statusDot = screen.getByTestId('status-dot-1');
    expect(statusDot).toHaveStyle('background-color: rgb(237, 108, 2)');
  });

  it('discharged dot color', () => {
    setup('Discharged');
    const statusDot = screen.getByTestId('status-dot-1');
    expect(statusDot).toHaveStyle('background-color: rgb(156, 39, 176)');
  });

  it('closed dot color', () => {
    setup('Closed');
    const statusDot = screen.getByTestId('status-dot-1');
    expect(statusDot).toHaveStyle('background-color: rgba(0, 0, 0, 0.08)');
  });

  it('active dot color', () => {
    setup('Active');
    const statusDot = screen.getByTestId('status-dot-1');
    expect(statusDot).toHaveStyle('background-color: rgb(46, 125, 50)');
  });

  it('calculated length of stay', () => {
    setup();
    const lengthOfStay = screen.getByText(/LOS \d+d/);
    expect(lengthOfStay).toHaveTextContent('LOS 1d');
  });
});

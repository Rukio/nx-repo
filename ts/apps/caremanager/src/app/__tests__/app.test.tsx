import { screen } from '@testing-library/react';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import {
  mockedGates,
  updateMockedGates,
} from '@*company-data-covered*/caremanager/utils-mocks';
import { App } from '../';

const setup = () => {
  return renderWithClient(<App />);
};

afterEach(() => {
  mockedGates.clear();
});

describe('App', () => {
  it('renders Episode page as initial route', async () => {
    setup();

    expect(await screen.findByText('Episodes')).toBeInTheDocument();
  });

  it('renders maintenance page', async () => {
    updateMockedGates('caremanager_maintenance_mode', true);
    setup();

    expect(
      await screen.findByText('Care Manager is under Maintenance')
    ).toBeInTheDocument();
  });
});

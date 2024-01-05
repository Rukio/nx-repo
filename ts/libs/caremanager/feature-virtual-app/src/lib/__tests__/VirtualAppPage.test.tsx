import { screen } from '../../test/testUtils';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { VirtualAppPage } from '../VirtualAppPage';

const setup = () => {
  renderWithClient(<VirtualAppPage />);
};

describe('VirtualAppPage', () => {
  beforeEach(() => {
    setup();
  });

  it('renders virtual app page', () => {
    expect(
      screen.getByTestId('caremanager-virtual-app-page-container')
    ).toBeInTheDocument();
  });
});

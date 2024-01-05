import { screen } from '@testing-library/react';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import SettingsHeader from '../SettingsHeader';

const setup = () => {
  const tab = 'task-templates';
  const onTabChange = vi.fn();
  renderWithClient(<SettingsHeader tab={tab} onTabChange={onTabChange} />);
};

describe('SettingsHeader', () => {
  it('renders correctly', () => {
    setup();
    expect(screen.getByTestId('settings-header')).toBeInTheDocument();
    expect(screen.getByTestId('settings-title')).toBeInTheDocument();
  });
});

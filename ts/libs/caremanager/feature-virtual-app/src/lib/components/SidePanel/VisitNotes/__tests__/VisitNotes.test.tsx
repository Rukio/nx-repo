import { render, screen } from '../../../../../test/testUtils';
import { SidePanelProvider } from '../../SidePanelContext';
import { VisitNotes } from '../VisitNotes';
import { describe } from 'vitest';

const setup = () => {
  const { user } = render(
    <SidePanelProvider>
      <VisitNotes />
    </SidePanelProvider>
  );

  return {
    user,
  };
};

describe('<VisitNotes />', () => {
  it('should render correctly', () => {
    setup();
    expect(
      screen.getByPlaceholderText(/Add a note for the team/)
    ).toBeVisible();
    expect(screen.getByText(/Post/)).toBeVisible();
  });
});

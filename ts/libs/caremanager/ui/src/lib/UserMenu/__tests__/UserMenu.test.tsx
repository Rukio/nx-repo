import { render, screen } from '@testing-library/react';
import UserMenu from '../UserMenu';

describe('UserMenu', () => {
  it('renders correctly', () => {
    render(<UserMenu isMobile={false} />);
    expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();
  });
});

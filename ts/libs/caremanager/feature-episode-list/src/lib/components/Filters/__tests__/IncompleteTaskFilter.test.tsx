import { render, screen } from '@testing-library/react';
import IncompleteTaskFilter from '../IncompleteTaskFilter';

describe('IncompleteTaskFilter', () => {
  it('renders incomplete task filter', () => {
    render(<IncompleteTaskFilter selected={false} setSelected={vi.fn()} />);
    expect(screen.getByTestId('incomplete-task-filter')).toBeInTheDocument();
  });
});

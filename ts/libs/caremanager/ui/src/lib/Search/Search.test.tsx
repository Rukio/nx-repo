import { render, screen, waitFor } from '@testing-library/react';
import { Search } from './Search';

const mockedFn = vi.fn();

const setup = () => {
  render(
    <Search
      onChange={mockedFn}
      onClick={mockedFn}
      value=""
      placeholder="Search by patient name"
      testId="episode-search-input"
      autoFocus
    />
  );
};

describe('search input', () => {
  beforeEach(() => {
    setup();
  });

  it('renders search bar', () => {
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('to have focus', () => {
    expect(screen.getByTestId('search-input')).toHaveFocus();
  });

  it('calls onClick when clicked', async () => {
    const searchInput = screen.getByTestId('search-input');
    searchInput.click();
    await waitFor(() => {
      expect(mockedFn).toHaveBeenCalled();
    });
  });

  it('calls clears text when button is clicked', async () => {
    const searchInput = screen.getByTestId('clear-button');
    searchInput.click();
    await waitFor(() => {
      expect(mockedFn).toHaveBeenCalledWith('');
    });
  });
});

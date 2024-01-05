import { render, screen } from '@testing-library/react';
import StoreProvider from './StoreProvider';

describe('StoreProvider', () => {
  it('should render fake child correctly', () => {
    const fakeChildTestId = 'fake-child';
    render(
      <StoreProvider>
        <div data-testid={fakeChildTestId} />
      </StoreProvider>
    );
    const fakeChild = screen.getByTestId(fakeChildTestId);
    expect(fakeChild).toBeTruthy();
  });
});

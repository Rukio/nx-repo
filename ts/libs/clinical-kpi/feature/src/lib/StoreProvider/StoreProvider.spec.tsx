import { render, screen } from '@testing-library/react';
import StoreProvider from './StoreProvider';

describe('StoreProviderKPI', () => {
  it('should render children', async () => {
    render(
      <StoreProvider>
        <p>Test Children</p>
      </StoreProvider>
    );
    const text = await screen.findByText('Test Children');
    expect(text).toBeTruthy();
  });
});

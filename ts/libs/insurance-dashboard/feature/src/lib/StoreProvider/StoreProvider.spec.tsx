import { render, screen } from '@testing-library/react';
import StoreProvider from './StoreProvider';

describe('StoreProvider', () => {
  it('should render child properly', () => {
    render(
      <StoreProvider>
        <p>Insurance Dashboard</p>
      </StoreProvider>
    );
    const text = screen.getByText('Insurance Dashboard');
    expect(text).toBeTruthy();
  });
});

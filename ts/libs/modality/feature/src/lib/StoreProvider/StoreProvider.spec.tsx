import { render, screen } from '@testing-library/react';
import StoreProvider from './StoreProvider';

describe('StoreProvider', () => {
  it('should render child properly', () => {
    render(
      <StoreProvider>
        <p>Modality</p>
      </StoreProvider>
    );
    const text = screen.getByText('Modality');
    expect(text).toBeTruthy();
  });
});

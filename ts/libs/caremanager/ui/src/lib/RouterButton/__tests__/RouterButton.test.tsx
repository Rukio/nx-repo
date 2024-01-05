import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RouterButton } from '../RouterButton';

const setup = () => {
  const props = {
    href: '/',
    testIdPrefix: 'test',
    title: 'Test Button',
  };

  const { container } = render(
    <BrowserRouter>
      <RouterButton {...props} />
    </BrowserRouter>
  );

  return { container };
};

describe('RouterButton', () => {
  it('renders correctly', () => {
    setup();
    expect(screen.getByTestId('test-router-button')).toBeInTheDocument();
  });
});

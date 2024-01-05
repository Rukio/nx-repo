import { render, screen } from '@testing-library/react';
import { FullScreen } from '../FullScreen';

const setup = () => {
  const props = {
    title: 'Care Manager is under Maintenance',
    message: 'We are down for maintenance',
    testId: 'maintenance-mode',
  };

  const { container } = render(<FullScreen {...props} />);

  return { container, props };
};

describe('FullScreen', () => {
  it('renders page', () => {
    const { props } = setup();
    expect(screen.getByTestId(props.testId)).toBeInTheDocument();
  });
});

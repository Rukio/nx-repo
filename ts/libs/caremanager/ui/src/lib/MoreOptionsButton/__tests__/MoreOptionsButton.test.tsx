import { render, screen } from '@testing-library/react';
import { MoreOptionsButton } from '../MoreOptionsButton';

const actions = [
  {
    label: 'test',
    handler: () => null,
  },
];

describe('MoreOptionsButton', () => {
  it('should render correctly with test id prefix', () => {
    render(<MoreOptionsButton actions={actions} testIdPrefix="test" />);
    expect(screen.getByTestId('test-open')).toBeInTheDocument();
  });

  it('should render correctly without test id prefix', () => {
    render(<MoreOptionsButton actions={actions} />);
    expect(screen.getByTestId('-open')).toBeInTheDocument();
  });

  it('should return null when no actions are passed', () => {
    const view = render(<MoreOptionsButton />);
    expect(view.container.firstChild).toBeNull();
  });
});

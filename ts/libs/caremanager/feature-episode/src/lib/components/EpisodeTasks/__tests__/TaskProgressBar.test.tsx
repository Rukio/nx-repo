import { render, screen } from '@testing-library/react';
import TaskProgressBar from '../TaskProgressBar';

const setup = () =>
  render(<TaskProgressBar completedTasks={1} totalTasks={3} />);

describe('TaskProgressBar', () => {
  it('renders progress bar', () => {
    setup();

    expect(screen.getByTestId('task-progress-bar')).toBeInTheDocument();
    expect(screen.getByTestId('task-progress-bar-label')).toBeInTheDocument();
  });

  it('progress bar contains correct value', () => {
    setup();

    expect(screen.getByText('1/3')).toBeInTheDocument();
  });
});

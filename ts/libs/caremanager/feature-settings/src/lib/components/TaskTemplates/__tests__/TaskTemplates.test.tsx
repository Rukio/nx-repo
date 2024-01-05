import { fireEvent, screen } from '@testing-library/react';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { BrowserRouter as Router } from 'react-router-dom';
import TaskTemplates from '../TaskTemplates';

const setup = () =>
  renderWithClient(
    <Router>
      <TaskTemplates />
    </Router>
  );

describe('TaskTemplates', () => {
  it('shows relevant filters when rendered', () => {
    setup();
    expect(screen.getByTestId('care-phase-filter')).toBeInTheDocument();
    expect(screen.getByTestId('service-line-filter')).toBeInTheDocument();
    expect(screen.getByTestId('template-search-input')).toBeInTheDocument();
  });

  it('there is a different view for when there are no templates', async () => {
    setup();

    expect(
      screen.queryByTestId('no-templates-container')
    ).not.toBeInTheDocument();
    const searchBar = screen.getByTestId('search-input');
    // this returns [] as the result of the query
    fireEvent.input(searchBar, { target: { value: 'none' } });

    expect(
      await screen.findByTestId('no-templates-container')
    ).toBeInTheDocument();
  });
});

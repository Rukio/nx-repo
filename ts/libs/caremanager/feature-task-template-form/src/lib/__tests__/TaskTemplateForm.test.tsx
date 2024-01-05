import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { MemoryRouter } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { TaskTemplateForm } from '../TaskTemplateForm';

const setup = () => {
  renderWithClient(
    <MemoryRouter initialEntries={['/settings/task-templates/new']}>
      <TaskTemplateForm />
    </MemoryRouter>
  );
};

describe('TaskTemplateForm', () => {
  it('renders all elements', async () => {
    setup();
    expect(
      screen.getByTestId('create-task-templates-header-title')
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId('create-task-template-details-name-text-area')
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId(
        'create-task-template-details-service-line-select'
      )
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId(
        'create-task-template-details-care-phase-select'
      )
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId(
        'create-task-template-details-summary-text-area'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('create-task-template-details-header')
    ).toBeInTheDocument();
    expect(screen.getByTestId('daily-and-onboarding-test')).toBeInTheDocument();
    expect(screen.getByTestId('nurse-navigator-test')).toBeInTheDocument();
    expect(screen.getByTestId('t1-test')).toBeInTheDocument();
    expect(screen.getByTestId('t2-test')).toBeInTheDocument();
  });
});

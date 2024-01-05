import { screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { IncompleteTasks } from '@*company-data-covered*/caremanager/data-access-types';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import TasksCell from '../TasksCell';

const setup = () => {
  const tasks = {} as IncompleteTasks;
  tasks.t1 = '5';
  renderWithClient(
    <BrowserRouter>
      <TasksCell
        episodeId="1"
        testId="tasks-cell-0"
        tasks={tasks}
        containerStyles={{}}
      />
    </BrowserRouter>
  );
};

describe('tasks cell', () => {
  it('correct tasks', () => {
    setup();
    const T1 = screen.getByText(/T1/);
    expect(T1).toHaveTextContent('T1: 5');
  });
});

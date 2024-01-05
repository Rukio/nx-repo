import { screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { SomethingWentWrong } from '../SomethingWentWrong';

const setup = () => {
  renderWithClient(
    <BrowserRouter>
      <SomethingWentWrong />
    </BrowserRouter>
  );
};

describe('SomethingWentWrong', () => {
  it('renders page', () => {
    setup();
    expect(screen.getByTestId('something-went-wrong-mode')).toBeInTheDocument();
  });
});

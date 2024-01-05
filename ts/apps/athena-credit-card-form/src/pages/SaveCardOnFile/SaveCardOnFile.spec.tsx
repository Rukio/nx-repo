import { render, screen } from '../../testUtils';
import SaveCardOnFile from './SaveCardOnFile';

describe('SaveCardOnFile', () => {
  it('should render correctly', () => {
    render(<SaveCardOnFile />, {}, { withRouter: true });

    const saveCardOnFileTitle = screen.getByText('Save Card on File');
    expect(saveCardOnFileTitle).toBeVisible();
  });
});

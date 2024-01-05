import { render, screen } from '../../testUtils';
import CollectPayment from './CollectPayment';

describe('CollectPayment', () => {
  it('should render correctly', () => {
    render(<CollectPayment />, {}, { withRouter: true });

    const collectPaymentTitle = screen.getByText('Collect Payment');
    expect(collectPaymentTitle).toBeVisible();
  });
});

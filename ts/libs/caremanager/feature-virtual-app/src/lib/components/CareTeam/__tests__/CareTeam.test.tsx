import { render, screen } from '../../../../test/testUtils';
import { CareTeam, CareTeamProps } from '../CareTeam';

const defaultProps: CareTeamProps = {
  carName: 'DEN005',
  firstName: 'Ted',
  lastName: 'Lasso',
  phoneNumber: '6295550129',
};

const setup = (props?: Partial<CareTeamProps>) => {
  return render(<CareTeam {...defaultProps} {...props} />);
};

describe('<CareTeam />', () => {
  it('should render correctly', () => {
    setup();
    expect(screen.getByText(/DEN005/)).toBeVisible();
    expect(screen.getByText(/Ted/)).toBeVisible();
    expect(screen.getByText(/Lasso/)).toBeVisible();
    expect(screen.getByText(/6295550129/)).toBeVisible();
  });

  it('should render status', () => {
    setup({ status: 'On Scene' });
    expect(screen.getByText(/On Scene/)).toBeVisible();
  });
});

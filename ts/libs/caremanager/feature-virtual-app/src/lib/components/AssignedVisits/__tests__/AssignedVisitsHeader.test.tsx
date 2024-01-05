import { screen, render } from '../../../../test/testUtils';
import {
  AssignedVisitsHeader,
  AssignedVisitsHeaderProps,
} from '../AssignedVisitsHeader';
import { ASSIGNED_VISITS_HEADER_TEST_IDS } from '../testIds';

const defaultProps: AssignedVisitsHeaderProps = {
  onOnCallDoctorsClick: vi.fn(),
  onOpenAthenaClick: vi.fn(),
  onOpenTytoCareClick: vi.fn(),
};

const setup = () => render(<AssignedVisitsHeader {...defaultProps} />);

describe('AssignedVisitsHeader', () => {
  test('should render all content', () => {
    setup();

    const onCallDoctorsButton = screen.getByTestId(
      ASSIGNED_VISITS_HEADER_TEST_IDS.onCallDoctorsButton
    );

    const openAthenaButton = screen.getByTestId(
      ASSIGNED_VISITS_HEADER_TEST_IDS.openAthena
    );

    const openTytoCareButton = screen.getByTestId(
      ASSIGNED_VISITS_HEADER_TEST_IDS.openTytoCare
    );

    expect(onCallDoctorsButton).toHaveTextContent(/On Call Doctors/gi);
    expect(openAthenaButton).toHaveTextContent(/Open Athena/gi);
    expect(openTytoCareButton).toHaveTextContent(/Open TytoCare/gi);
  });

  test('should call callback when "On Call Doctors" button clicked', async () => {
    const { user } = setup();

    const onCallDoctorsButton = screen.getByTestId(
      ASSIGNED_VISITS_HEADER_TEST_IDS.onCallDoctorsButton
    );

    await user.click(onCallDoctorsButton);

    expect(defaultProps.onOnCallDoctorsClick).toHaveBeenCalledTimes(1);
  });

  test('should call callback when "Open Athena" button clicked', async () => {
    const { user } = setup();

    const openAthenaButton = screen.getByTestId(
      ASSIGNED_VISITS_HEADER_TEST_IDS.openAthena
    );

    await user.click(openAthenaButton);

    expect(defaultProps.onOpenAthenaClick).toHaveBeenCalledTimes(1);
  });

  test('should call callback when "Open TytoCare" button clicked', async () => {
    const { user } = setup();

    const openTytoCareButton = screen.getByTestId(
      ASSIGNED_VISITS_HEADER_TEST_IDS.openTytoCare
    );

    await user.click(openTytoCareButton);

    expect(defaultProps.onOpenTytoCareClick).toHaveBeenCalledTimes(1);
  });
});

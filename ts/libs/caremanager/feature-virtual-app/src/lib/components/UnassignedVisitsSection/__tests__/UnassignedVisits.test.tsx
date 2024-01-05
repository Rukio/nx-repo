import { screen, renderWithClient } from '../../../../test/testUtils';
import { UnassignedVisitsSection } from '../UnassignedVisitsSection';
import {
  UNASSIGNED_VISITS_TEST_IDS,
  AVAILABLE_VISITS_TAB_TEST_IDS,
  SCHEDULED_VISITS_TAB_TEST_IDS,
} from '../testIds';

const setup = () => renderWithClient(<UnassignedVisitsSection />);

describe('Unassigned visits', () => {
  test('should render correctly', () => {
    setup();

    expect(
      screen.getByTestId(UNASSIGNED_VISITS_TEST_IDS.CONTAINER)
    ).toBeVisible();

    expect(
      screen.getByTestId(UNASSIGNED_VISITS_TEST_IDS.FILTERS)
    ).toBeVisible();

    expect(screen.getByTestId(UNASSIGNED_VISITS_TEST_IDS.HEADER)).toBeVisible();

    expect(
      screen.getByTestId(UNASSIGNED_VISITS_TEST_IDS.TAB_SWITCH)
    ).toBeVisible();

    expect(
      screen.getByTestId(UNASSIGNED_VISITS_TEST_IDS.TAB_AVAILABLE_VISITS)
    ).toBeVisible();

    expect(
      screen.getByTestId(UNASSIGNED_VISITS_TEST_IDS.TAB_SCHEDULED_VISITS)
    ).toBeVisible();
  });

  test('should switch the tab after click', async () => {
    const { user } = setup();

    const availableVisitsTab = screen.getByTestId(
      UNASSIGNED_VISITS_TEST_IDS.TAB_AVAILABLE_VISITS
    );

    const scheduledVisitsTab = screen.getByTestId(
      UNASSIGNED_VISITS_TEST_IDS.TAB_SCHEDULED_VISITS
    );

    expect(
      await screen.findByTestId(SCHEDULED_VISITS_TAB_TEST_IDS.CONTAINER)
    ).toBeVisible();
    expect(
      screen.queryByTestId(AVAILABLE_VISITS_TAB_TEST_IDS.CONTAINER)
    ).not.toBeInTheDocument();

    await user.click(availableVisitsTab);

    expect(
      screen.queryByTestId(SCHEDULED_VISITS_TAB_TEST_IDS.CONTAINER)
    ).not.toBeInTheDocument();
    expect(
      await screen.findByTestId(AVAILABLE_VISITS_TAB_TEST_IDS.CONTAINER)
    ).toBeVisible();

    await user.click(scheduledVisitsTab);

    expect(
      await screen.findByTestId(SCHEDULED_VISITS_TAB_TEST_IDS.CONTAINER)
    ).toBeVisible();
    expect(
      screen.queryByTestId(AVAILABLE_VISITS_TAB_TEST_IDS.CONTAINER)
    ).not.toBeInTheDocument();
  });
});

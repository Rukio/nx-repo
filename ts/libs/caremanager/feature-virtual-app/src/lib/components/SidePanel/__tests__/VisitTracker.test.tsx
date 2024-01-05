import { screen, render } from '../../../../test/testUtils';
import { VisitTracker, MOCKED_VISITS } from '../VisitTracker';
import { VISIT_TRACKER_TEST_IDS } from '../testIds';

const setup = () => render(<VisitTracker visits={MOCKED_VISITS} />);

describe('VisitTracker', () => {
  it('should render correctly', () => {
    setup();

    expect(screen.getByTestId(VISIT_TRACKER_TEST_IDS.CONTAINER)).toBeVisible();

    expect(screen.getAllByTestId(VISIT_TRACKER_TEST_IDS.LABEL).length).toEqual(
      MOCKED_VISITS.length
    );
  });

  it('should correctly render all visits', async () => {
    setup();

    for (let i = 0; i < MOCKED_VISITS.length; i++) {
      expect(await screen.findByText(MOCKED_VISITS[i].status)).toBeVisible();
    }
  });
});

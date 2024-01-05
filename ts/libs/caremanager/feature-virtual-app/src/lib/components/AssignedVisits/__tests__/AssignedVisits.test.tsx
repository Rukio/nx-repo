import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { screen, renderWithClient } from '../../../../test/testUtils';
import { AssignedVisits } from '../AssignedVisits';
import { SidePanelProvider } from '../../SidePanel';
import {
  ASSIGNED_VISITS_TEST_IDS,
  VISITS_ACCORDION_TEST_IDS,
} from '../testIds';
import { VIRTUAL_APP_CARD_TEST_IDS } from '../../VisitCard/testIds';
import {
  SIDE_PANEL_TEST_IDS,
  VISIT_TRACKER_TEST_IDS,
} from '../../SidePanel/testIds';

const {
  virtualAppVisits: { assigned: mockedAssignedVirtualVisits },
} = JSONMocks;

const setup = () => {
  return renderWithClient(
    <SidePanelProvider>
      <AssignedVisits />
    </SidePanelProvider>
  );
};

describe('AssignedVisits', () => {
  it('should render correctly', async () => {
    setup();
    expect(screen.getByTestId(ASSIGNED_VISITS_TEST_IDS.ROOT)).toBeVisible();

    expect(
      await screen.findByTestId(VISITS_ACCORDION_TEST_IDS.ROOT('onScene'))
    ).toBeVisible();

    expect(
      await screen.findByTestId(VISITS_ACCORDION_TEST_IDS.ROOT('enRoute'))
    ).toBeVisible();
  });

  it('show the side panel after clicking on the visit card', async () => {
    const { user } = setup();

    const visitId = mockedAssignedVirtualVisits[0].visit.id;

    const visit = await screen.findByTestId(
      VIRTUAL_APP_CARD_TEST_IDS.CARD_ROOT(visitId)
    );

    await user.click(visit);

    expect(
      await screen.findByTestId(SIDE_PANEL_TEST_IDS.CONTAINER)
    ).toBeVisible();

    expect(
      await screen.findByTestId(VISIT_TRACKER_TEST_IDS.CONTAINER)
    ).toBeVisible();
  });
});

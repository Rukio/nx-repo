import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';

import { screen, renderWithClient } from '../../../../test/testUtils';
import { VIRTUAL_APP_CARD_TEST_IDS } from '../../VisitCard/testIds';
import { UnassignedVisitsSection } from '../UnassignedVisitsSection';
import { UNASSIGNED_VISITS_TEST_IDS } from '../testIds';

const setup = () => renderWithClient(<UnassignedVisitsSection />);

const {
  virtualAppVisits: { available: mockedAvailableVirtualVisits },
} = JSONMocks;

describe('<AvailableVisitsTabPanel />', () => {
  test('should render correctly', async () => {
    const { user } = setup();

    const availableVisitsTab = screen.getByTestId(
      UNASSIGNED_VISITS_TEST_IDS.TAB_AVAILABLE_VISITS
    );

    await user.click(availableVisitsTab);

    for (const availableVirtualVisit of mockedAvailableVirtualVisits) {
      const availableVisitCard = await screen.findByTestId(
        VIRTUAL_APP_CARD_TEST_IDS.CARD_ROOT(availableVirtualVisit.visit.id)
      );
      expect(availableVisitCard).toBeVisible();
    }
  });
});

import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';

import { screen, renderWithClient } from '../../../../test/testUtils';
import { VIRTUAL_APP_CARD_TEST_IDS } from '../../VisitCard/testIds';
import { UnassignedVisitsSection } from '../UnassignedVisitsSection';

const setup = () => renderWithClient(<UnassignedVisitsSection />);

const {
  virtualAppVisits: { scheduled: mockedScheduledVirtualVisits },
} = JSONMocks;

describe('<ScheduledVisitsTabPanel />', () => {
  test('should render correctly', async () => {
    setup();

    for (const scheduledVirtualVisit of mockedScheduledVirtualVisits) {
      const scheduledVisitCard = await screen.findByTestId(
        VIRTUAL_APP_CARD_TEST_IDS.CARD_ROOT(scheduledVirtualVisit.visit.id)
      );
      expect(scheduledVisitCard).toBeVisible();
    }
  });
});

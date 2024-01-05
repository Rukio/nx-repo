import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { screen, render } from '../../../../test/testUtils';
import { SidePanelProvider } from '../../SidePanel';
import { VisitsAccordion, VisitsAccordionProps } from '../VisitsAccordion';
import { VIRTUAL_APP_CARD_TEST_IDS } from '../../VisitCard';
import { VISITS_ACCORDION_TEST_IDS } from '../testIds';

const {
  virtualAppVisits: { assigned: mockedAssignedVirtualVisits },
} = JSONMocks;

const setup = (props?: Partial<VisitsAccordionProps>) => {
  const defaultProps: VisitsAccordionProps = {
    header: 'On Scene',
    visits: mockedAssignedVirtualVisits.map((virtualVisit) => {
      const mappedVirtualVisit: Record<string, any> = { ...virtualVisit };

      mappedVirtualVisit.visit.episodeId = virtualVisit.visit.episode_id;
      mappedVirtualVisit.visit.createdAt = virtualVisit.visit.created_at;
      mappedVirtualVisit.visit.updatedAt = virtualVisit.visit.updated_at;

      return mappedVirtualVisit;
    }),
    ...props,
  };

  return render(
    <SidePanelProvider>
      <VisitsAccordion {...defaultProps} />
    </SidePanelProvider>
  );
};

describe('<VisitsAccordion />', () => {
  it('should render correctly', () => {
    setup({ testIdPrefix: 'onScene' });

    expect(
      screen.getByTestId(VISITS_ACCORDION_TEST_IDS.ROOT('onScene'))
    ).toBeVisible();
  });

  it('show the visit cards after clicking on the accordion title', async () => {
    const visitId = mockedAssignedVirtualVisits[0].visit.id;
    const { user } = setup({ testIdPrefix: 'onScene' });

    const title = screen.getByTestId(
      VISITS_ACCORDION_TEST_IDS.TITLE('onScene')
    );

    await user.click(title);

    const visit = await screen.findByTestId(
      VIRTUAL_APP_CARD_TEST_IDS.CARD_ROOT(visitId)
    );

    expect(visit).toBeVisible();
  });
});

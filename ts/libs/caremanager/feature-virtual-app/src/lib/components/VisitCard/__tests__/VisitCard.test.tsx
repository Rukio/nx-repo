import { render, screen } from '../../../../test/testUtils';
import { VisitCard, VisitCardProps } from '../VisitCard';
import { VIRTUAL_APP_CARD_TEST_IDS } from '../testIds';
import { SidePanelProvider } from '../../SidePanel';

const MOCKED_VISIT = {
  visit: {
    id: '123',
    episodeId: '123',
    createdAt: '',
    updatedAt: '',
    careRequestId: '5189123',
    carName: 'DEN005',
    status: 'on_scene',
  },
  patient: {
    id: '990123',
    firstName: 'Doris',
    lastName: 'Farrell',
    dateOfBirth: '1985-05-13',
    sex: 'female',
  },
  episode: {
    id: '090123',
    admittedAt: '',
    patientSummary: '',
    serviceLineId: '123333',
    carePhaseId: '18',
    patientId: '990123',
    isWaiver: false,
    marketId: '189',
    market: {
      id: '189',
      name: 'Los Angeles',
      shortName: 'LA',
      scheduleDays: [],
      tzName: 'America/Los_Angeles',
    },
  },
};

const setup = (props?: Partial<VisitCardProps>) => {
  const defaultProps: VisitCardProps = {
    ...MOCKED_VISIT,
    isSidePanelOpen: false,
    ...props,
  };

  const { user } = render(
    <SidePanelProvider>
      <VisitCard {...defaultProps} />
    </SidePanelProvider>
  );

  return {
    user,
  };
};

describe('VisitCard', () => {
  it('should render correctly', () => {
    setup();

    expect(screen.getByText(/Doris Farrell/)).toBeInTheDocument();
    expect(screen.getByText(/05\/13\/1985/)).toBeInTheDocument();
    expect(screen.getByText(/38yo F/)).toBeInTheDocument();
    expect(screen.getByText(/America\/Los_Angeles/)).toBeInTheDocument();
    expect(screen.getByText(/DEN005/)).toBeInTheDocument();
    expect(screen.getByText(/on_scene/)).toBeInTheDocument();
  });

  it.each([
    { isSidePanelOpen: true, expectedOutline: 'solid' },
    { isSidePanelOpen: false, expectedOutline: 'none' },
  ])(
    'when the card receives the parameter isSidePanelOpen as %p, the outline should be %p',
    ({ isSidePanelOpen, expectedOutline }) => {
      it('should have the correct outline style', async () => {
        setup({
          isSidePanelOpen,
        });

        const visitId = MOCKED_VISIT.visit.id;
        const container = screen.getByTestId(
          VIRTUAL_APP_CARD_TEST_IDS.CARD_ROOT(visitId)
        );

        const computedStyles = getComputedStyle(container);

        expect(computedStyles.getPropertyValue('outline')).toBe(
          expectedOutline
        );
      });
    }
  );

  it('clicking card should not change the outline if the status of Visit is `Scheduled`', async () => {
    const { user } = setup({
      visit: {
        ...MOCKED_VISIT.visit,
        status: 'scheduled',
      },
    });
    const visitId = MOCKED_VISIT.visit.id;

    const container = screen.getByTestId(
      VIRTUAL_APP_CARD_TEST_IDS.CARD_ROOT(visitId)
    );

    await user.click(container);

    const computedStyles = getComputedStyle(container);

    expect(computedStyles.getPropertyValue('outline')).not.toBe('solid');
  });

  it('clicking card should not change the outline if the status of Visit is `Available`', async () => {
    const { user } = setup({
      visit: {
        ...MOCKED_VISIT.visit,
        status: 'available',
      },
    });
    const visitId = MOCKED_VISIT.visit.id;

    const container = screen.getByTestId(
      VIRTUAL_APP_CARD_TEST_IDS.CARD_ROOT(visitId)
    );

    await user.click(container);

    const computedStyles = getComputedStyle(container);

    expect(computedStyles.getPropertyValue('outline')).not.toBe('solid');
  });
});

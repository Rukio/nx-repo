import { screen, render } from '../../../../test/testUtils';
import { SidePanel, SidePanelProps } from '../SidePanel';
import { PATIENT_INFO_HEADER_TEST_IDS, SIDE_PANEL_TEST_IDS } from '../testIds';

const setup = (props: Partial<SidePanelProps>) => {
  const defaultProps: SidePanelProps = {
    virtualVisit: {
      visit: {
        id: '123',
        episodeId: '1',
        createdAt: '',
        updatedAt: '',
        careRequestId: '123123',
        carName: 'DEN004',
      },
    },
    isOpen: true,
    ...props,
  };

  return render(<SidePanel {...defaultProps} />);
};

describe('SidePanel', () => {
  it('renders correctly and onclose callback works', async () => {
    const sidePanelClick = vi.fn();
    const { user } = setup({ onClose: sidePanelClick });

    expect(
      await screen.findByTestId(SIDE_PANEL_TEST_IDS.CONTAINER)
    ).toBeVisible();

    const closeButton = await screen.findByTestId(
      PATIENT_INFO_HEADER_TEST_IDS.CLOSE_BUTTON
    );

    expect(closeButton).toBeVisible();

    await user.click(closeButton);

    expect(sidePanelClick).toBeCalledTimes(1);
  });

  test('should not render close button if onClose callback is undefined', () => {
    setup({ isOpen: true });

    expect(
      screen.queryByTestId(PATIENT_INFO_HEADER_TEST_IDS.CLOSE_BUTTON)
    ).not.toBeInTheDocument();
  });
});

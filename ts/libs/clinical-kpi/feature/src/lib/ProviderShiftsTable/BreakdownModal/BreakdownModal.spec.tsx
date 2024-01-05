import { render, screen } from '../../util/testUtils';
import BreakdownModal, {
  formatSelectedServiceDate,
  mapBreakdownToOnSceneEvents,
} from './BreakdownModal';
import { BREAKDOWN_MODAL_TEST_IDS } from './testIds';
import { MOCK_TIMELINE_EVENTS } from './mocks';

const defaultProps = {
  isModalOpen: true,
  handleClose: jest.fn(),
};

const setup = () => {
  return render(<BreakdownModal {...defaultProps} />);
};

describe('BreakdownModal', () => {
  test('should show modal content', () => {
    setup();

    const header = screen.getByTestId(BREAKDOWN_MODAL_TEST_IDS.HEADER);
    const closeIcon = screen.getByTestId(BREAKDOWN_MODAL_TEST_IDS.CLOSE_ICON);
    const alert = screen.getByTestId(BREAKDOWN_MODAL_TEST_IDS.ALERT);
    const timeline = screen.getByTestId(BREAKDOWN_MODAL_TEST_IDS.TIMELIME);

    expect(header).toBeVisible();
    expect(closeIcon).toBeVisible();
    expect(alert).toBeVisible();
    expect(timeline).toBeVisible();
  });

  test('should call handleClose when closeIcon is clicked', async () => {
    const { user } = setup();

    const closeIcon = screen.getByTestId(BREAKDOWN_MODAL_TEST_IDS.CLOSE_ICON);

    await user.click(closeIcon);

    expect(defaultProps.handleClose).toHaveBeenCalledTimes(1);
  });
});

describe('formatSelectedServiceDate', () => {
  it.each([
    {
      serviceDate: { year: 2023, month: 4, day: 20 },
      expected: '20 Apr',
    },
    {
      serviceDate: { year: 2007, month: 7, day: 7 },
      expected: '7 Jul',
    },
    {
      serviceDate: undefined,
      expected: 'X',
    },
  ])('should format the date', ({ expected, serviceDate }) => {
    const date = formatSelectedServiceDate(serviceDate);
    expect(date).toBe(expected);
  });
});

describe('mapBreakdownToOnSceneEvents', () => {
  it('should return correct value', () => {
    const timelineEvents = mapBreakdownToOnSceneEvents(MOCK_TIMELINE_EVENTS);

    timelineEvents.forEach((snapshot) => {
      expect(snapshot.startTime).toEqual(snapshot.startTime.replace('Z', ''));
      expect(snapshot.endTime).toEqual(snapshot.endTime.replace('Z', ''));
    });
  });
});

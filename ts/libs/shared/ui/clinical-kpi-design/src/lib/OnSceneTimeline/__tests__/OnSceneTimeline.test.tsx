import { render, screen } from '../../../testUtils/test-utils';
import { BasicOnSceneTimeLine } from '../__storybook__/OnSceneTimeline.stories';
import {
  calculateDisplayTimeRange,
  getTimeLabelLeftOffset,
} from '../utilities';
import {
  OnSceneTimeLineEvent,
  Event,
  TIME_LABEL_TEST_ID,
  LEGEND_EVENT_TEST_ID,
} from '../index';

const getMillisecondsFromDateString = (date: string): number =>
  new Date(date).getTime();

describe('Unit tests', () => {
  describe('getTimeLabelLeftOffset()', () => {
    it('should return 0 if isFirstTimeLabel is true', () => {
      const actualResult = getTimeLabelLeftOffset(true, false);
      expect(actualResult).toEqual('0');
    });

    it('should return -30 if isLastLabel is true', () => {
      const actualResult = getTimeLabelLeftOffset(false, true);
      expect(actualResult).toEqual('-30');
    });

    it('should return -15 if isFirstTimeLabel and isLastLabel are false', () => {
      const actualResult = getTimeLabelLeftOffset(false, false);
      expect(actualResult).toEqual('-15');
    });
  });

  describe('calculateDisplayTimeRange()', () => {
    it('should return correct values when first event start at X hours sharp', () => {
      const firstEvent: OnSceneTimeLineEvent = {
        type: Event.EnRoute,
        startTime: '2023-05-23T10:00:00',
        endTime: '2023-05-23T10:40:00',
      };
      const expectedMinTimeDate = '2023-05-23T10:00:00';

      const lastEvent: OnSceneTimeLineEvent = {
        type: Event.OnScene,
        startTime: '2023-05-23T10:40:00',
        endTime: '2023-05-23T12:20:00',
      };
      const expectedMaxTimeDate = '2023-05-23T13:00:00';

      const { minTimeInMs: actualMinTime, maxTimeInMs: actualMaxTime } =
        calculateDisplayTimeRange(firstEvent, lastEvent);

      expect(actualMinTime).toEqual(
        getMillisecondsFromDateString(expectedMinTimeDate)
      );
      expect(actualMaxTime).toEqual(
        getMillisecondsFromDateString(expectedMaxTimeDate)
      );
    });

    it('should return correct values when first event start at X hours and Y minutes', () => {
      const firstEvent: OnSceneTimeLineEvent = {
        type: Event.EnRoute,
        startTime: '2023-05-23T10:38:00',
        endTime: '2023-05-23T10:52:00',
      };
      const expectedMinTimeDate = '2023-05-23T10:00:00';

      const lastEvent: OnSceneTimeLineEvent = {
        type: Event.OnScene,
        startTime: '2023-05-23T10:52:00',
        endTime: '2023-05-23T12:20:00',
      };
      const expectedMaxTimeDate = '2023-05-23T13:00:00';

      const { minTimeInMs: actualMinTime, maxTimeInMs: actualMaxTime } =
        calculateDisplayTimeRange(firstEvent, lastEvent);

      expect(actualMinTime).toEqual(
        getMillisecondsFromDateString(expectedMinTimeDate)
      );
      expect(actualMaxTime).toEqual(
        getMillisecondsFromDateString(expectedMaxTimeDate)
      );
    });
  });
});

describe('Integration tests', () => {
  test('snapshot tests', () => {
    const { asFragment } = render(<BasicOnSceneTimeLine />);
    expect(asFragment()).toMatchSnapshot();
  });

  test('should render correct amount of time labels', () => {
    render(<BasicOnSceneTimeLine />);

    const timeLabels = screen.getAllByTestId(TIME_LABEL_TEST_ID);

    expect(timeLabels.length).toEqual(10);

    timeLabels.forEach((timeLabel) => expect(timeLabel).toBeInTheDocument());
  });

  test('should render correct amount of legend circles', () => {
    render(<BasicOnSceneTimeLine />);

    Object.values(Event).forEach((legendEvent) => {
      const legendCircle = screen.getByTestId(
        LEGEND_EVENT_TEST_ID(legendEvent)
      );

      expect(legendCircle).toBeInTheDocument();
    });
  });
});

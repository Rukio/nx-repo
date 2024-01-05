import { render, screen } from '../../testUtils';
import dayjs from 'dayjs';
import RequestDetails from './RequestDetails';
import { REQUEST_DETAILS_TEST_IDS } from './testIds';
import { SessionStorageKeys } from '../constants';

jest.mock('statsig-js', () => ({
  ...jest.requireActual('statsig-js'),
  logEvent: jest.fn(),
  checkGate: jest.fn(),
  getExperiment: () => ({
    get: (_name: string, fallback: unknown) => fallback,
  }),
  getConfig: () => ({
    get: (_name: string, fallback: unknown) => fallback,
  }),
}));

describe('<RequestDetails />', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('1970-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('RequestDetails snapshot without progress', () => {
    window.sessionStorage.setItem(
      SessionStorageKeys.PreferredEtaStart,
      dayjs().utc().format()
    );
    const { asFragment } = render(<RequestDetails />);

    expect(asFragment()).toMatchSnapshot();
  });

  describe('Check the day of visit', () => {
    afterEach(() => {
      sessionStorage.clear();
    });

    it('should not display a specific day of visit - visit date not set', () => {
      render(<RequestDetails />);

      expect(
        screen.getByTestId(
          REQUEST_DETAILS_TEST_IDS.VISIT_TIMELINE_WITHOUTCALL_FORM
        )
      ).toHaveTextContent(/We’ll come to your home/i);
    });

    it('should not display a specific day of visit - visit date not for today / tomorrow', () => {
      window.sessionStorage.setItem(
        SessionStorageKeys.PreferredEtaStart,
        '1970-01-01T00:00:00Z'
      );
      render(<RequestDetails />);

      expect(
        screen.getByTestId(
          REQUEST_DETAILS_TEST_IDS.VISIT_TIMELINE_WITHOUTCALL_FORM
        )
      ).toHaveTextContent(/We’ll come to your home/i);
    });
  });
});

import statsig from 'statsig-js';
import {
  StatsigEvents,
  StatsigActions,
  StatsigPageCategory,
} from '@*company-data-covered*/consumer-web-types';
import { mocked } from 'jest-mock';
import { render, screen, waitFor } from '../../testUtils';
import HowItWorks from './HowItWorks';
import { HOW_IT_WORKS_TEST_IDS } from './testIds';
import { WEB_REQUEST_ROUTES } from '../constants';

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn().mockImplementation(() => mockUseNavigate),
}));

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

const mockStatsigLogEvent = mocked(statsig.logEvent);

describe('<HowItWorks />', () => {
  it('should render correctly', () => {
    render(<HowItWorks />);

    const title = screen.getByTestId(HOW_IT_WORKS_TEST_IDS.TITLE);
    expect(title).toBeVisible();
    expect(title).toHaveTextContent('Healthcare in your home. On your terms.');

    const subTitle = screen.getByTestId(HOW_IT_WORKS_TEST_IDS.SUBTITLE);
    expect(subTitle).toBeVisible();
    expect(subTitle).toHaveTextContent(
      'Schedule a visit and our fully-equipped medical team will come right to your door.'
    );

    const bookAppointmentBtn = screen.getByTestId(HOW_IT_WORKS_TEST_IDS.TITLE);
    expect(bookAppointmentBtn).toBeVisible();
    expect(bookAppointmentBtn).toBeEnabled();
  });

  it('should call router push when book appointment btn clicked', async () => {
    const { user } = render(<HowItWorks />);

    const bookAppointmentBtn = screen.getByTestId(
      HOW_IT_WORKS_TEST_IDS.BOOK_APPOINTMENT_BTN
    );
    expect(bookAppointmentBtn).toBeVisible();
    expect(bookAppointmentBtn).toBeEnabled();
    await user.click(bookAppointmentBtn);

    await waitFor(() => {
      expect(mockUseNavigate).toBeCalledWith(
        WEB_REQUEST_ROUTES.requestPreferredTime
      );
    });
  });

  it('should call statsig log event on init', async () => {
    render(<HowItWorks />);

    await waitFor(() => {
      expect(mockStatsigLogEvent).toBeCalledWith(
        StatsigEvents.REQUEST_HOW_IT_WORKS_EVENT,
        StatsigActions.WEB_REQUEST_TYPE,
        {
          origin: 'localhost',
          page: StatsigPageCategory.REQUEST_HOW_IT_WORKS,
        }
      );
    });
  });
});
